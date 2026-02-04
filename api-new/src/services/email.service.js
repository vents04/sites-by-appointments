/**
 * Email Service
 * Handles transactional email sending with i18n support
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const { i18next } = require('../i18n');
const icsService = require('./ics.service');
const { decrypt } = require('../utils/crypto.utils');
const { formatInTZ } = require('../utils/date.utils');
const logger = require('../utils/logger');

/**
 * Create a nodemailer transporter
 * @param {Object} smtpConfig - SMTP configuration
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = (smtpConfig) => {
  return nodemailer.createTransport({
    host: smtpConfig.host || config.smtp.host,
    port: smtpConfig.port || config.smtp.port,
    secure: smtpConfig.secure !== undefined ? smtpConfig.secure : config.smtp.secure,
    auth: {
      user: smtpConfig.user || config.smtp.user,
      pass: smtpConfig.pass || config.smtp.pass
    }
  });
};

/**
 * Send booking confirmation email
 * @param {Object} booking - Booking event with populated refs
 * @param {Object} business - Business document
 * @param {string} language - Language code (bg/en)
 */
const sendBookingConfirmation = async (booking, business, language = 'bg') => {
  if (!business.emailConfig?.enabled) {
    logger.info(`Email disabled for business ${business.code}, skipping confirmation`);
    return;
  }
  
  const customerEmail = booking.customerSnapshot?.email;
  if (!customerEmail) {
    logger.info(`No email for customer, skipping confirmation`);
    return;
  }
  
  const t = i18next.getFixedT(language, 'emails');
  
  // Format date/time in business timezone
  const formattedDate = formatInTZ(booking.dtstart, business.timezone, 'dd.MM.yyyy');
  const formattedTime = formatInTZ(booking.dtstart, business.timezone, 'HH:mm');
  
  const subject = t('bookingConfirmation.subject');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${t('bookingConfirmation.subject')}</h2>
      
      <p>${t('bookingConfirmation.greeting', { name: booking.customerSnapshot?.name })}</p>
      <p>${t('bookingConfirmation.body')}</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${t('bookingConfirmation.details')}</h3>
        <p><strong>${t('bookingConfirmation.service')}:</strong> ${booking.serviceSnapshot?.name || 'N/A'}</p>
        <p><strong>${t('bookingConfirmation.date')}:</strong> ${formattedDate}</p>
        <p><strong>${t('bookingConfirmation.time')}:</strong> ${formattedTime}</p>
        ${booking.employeeId?.name ? `<p><strong>${t('bookingConfirmation.employee')}:</strong> ${booking.employeeId.name}</p>` : ''}
        ${booking.locationId?.formattedAddress ? `<p><strong>${t('bookingConfirmation.location')}:</strong> ${booking.locationId.formattedAddress}</p>` : ''}
      </div>
      
      <p>${t('bookingConfirmation.footer')}</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      
      <div style="color: #666; font-size: 12px;">
        <p><strong>${business.name}</strong></p>
        ${business.phone ? `<p>${t('common.phone')}: ${business.phone}</p>` : ''}
        ${business.email ? `<p>${t('common.email')}: ${business.email}</p>` : ''}
        ${business.website ? `<p>${t('common.website')}: ${business.website}</p>` : ''}
        <p style="margin-top: 10px;">${t('common.poweredBy')}</p>
      </div>
    </div>
  `;
  
  // Generate .ics attachment
  let attachments = [];
  try {
    const icsAttachment = icsService.generateBookingAttachment(booking, business);
    attachments = [icsAttachment];
  } catch (error) {
    logger.warn('Failed to generate ICS attachment:', error.message);
  }
  
  // Get SMTP config (use business config or default)
  let smtpConfig = {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    user: config.smtp.user,
    pass: config.smtp.pass
  };
  
  let from = config.smtp.user;
  
  if (business.emailConfig?.smtpUser) {
    smtpConfig = {
      host: business.emailConfig.smtpHost,
      port: business.emailConfig.smtpPort,
      user: business.emailConfig.smtpUser,
      pass: business.emailConfig.smtpPasswordEncrypted 
        ? decrypt(business.emailConfig.smtpPasswordEncrypted, config.jwt.secret)
        : ''
    };
    from = `"${business.emailConfig.senderName || business.name}" <${business.emailConfig.senderEmail || smtpConfig.user}>`;
  }
  
  try {
    const transporter = createTransporter(smtpConfig);
    
    await transporter.sendMail({
      from,
      to: customerEmail,
      subject,
      html,
      attachments
    });
    
    logger.info(`Booking confirmation email sent to ${customerEmail}`);
  } catch (error) {
    logger.error(`Failed to send booking confirmation email:`, error);
    throw error;
  }
};

/**
 * Send booking cancellation email
 * @param {Object} booking - Booking event
 * @param {Object} business - Business document
 * @param {string} reason - Cancellation reason
 * @param {string} language - Language code
 */
const sendBookingCancellation = async (booking, business, reason = '', language = 'bg') => {
  if (!business.emailConfig?.enabled) {
    return;
  }
  
  const customerEmail = booking.customerSnapshot?.email;
  if (!customerEmail) {
    return;
  }
  
  const t = i18next.getFixedT(language, 'emails');
  
  const formattedDate = formatInTZ(booking.dtstart, business.timezone, 'dd.MM.yyyy');
  const formattedTime = formatInTZ(booking.dtstart, business.timezone, 'HH:mm');
  
  const subject = t('bookingCancellation.subject');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${t('bookingCancellation.subject')}</h2>
      
      <p>${t('bookingCancellation.greeting', { name: booking.customerSnapshot?.name })}</p>
      <p>${t('bookingCancellation.body')}</p>
      
      <div style="background: #fff3f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${t('bookingCancellation.details')}</h3>
        <p><strong>${t('bookingCancellation.service')}:</strong> ${booking.serviceSnapshot?.name || 'N/A'}</p>
        <p><strong>${t('bookingCancellation.date')}:</strong> ${formattedDate}</p>
        <p><strong>${t('bookingCancellation.time')}:</strong> ${formattedTime}</p>
        ${reason ? `<p><strong>${t('bookingCancellation.reason')}:</strong> ${reason}</p>` : ''}
      </div>
      
      <p>${t('bookingCancellation.footer')}</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      
      <div style="color: #666; font-size: 12px;">
        <p><strong>${business.name}</strong></p>
        ${business.phone ? `<p>${t('common.phone')}: ${business.phone}</p>` : ''}
        <p style="margin-top: 10px;">${t('common.poweredBy')}</p>
      </div>
    </div>
  `;
  
  try {
    const transporter = createTransporter({});
    
    await transporter.sendMail({
      from: config.smtp.user,
      to: customerEmail,
      subject,
      html
    });
    
    logger.info(`Booking cancellation email sent to ${customerEmail}`);
  } catch (error) {
    logger.error(`Failed to send booking cancellation email:`, error);
  }
};

/**
 * Send booking reminder email
 * @param {Object} booking - Booking event
 * @param {Object} business - Business document
 * @param {string} reminderType - '24h' or '1h'
 * @param {string} language - Language code
 */
const sendBookingReminder = async (booking, business, reminderType = '24h', language = 'bg') => {
  if (!business.emailConfig?.enabled) {
    return;
  }
  
  const customerEmail = booking.customerSnapshot?.email;
  if (!customerEmail) {
    return;
  }
  
  const t = i18next.getFixedT(language, 'emails');
  
  const formattedDate = formatInTZ(booking.dtstart, business.timezone, 'dd.MM.yyyy');
  const formattedTime = formatInTZ(booking.dtstart, business.timezone, 'HH:mm');
  
  const subject = t('bookingReminder.subject');
  const bodyKey = reminderType === '24h' ? 'bookingReminder.body24h' : 'bookingReminder.body1h';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${t('bookingReminder.subject')}</h2>
      
      <p>${t('bookingReminder.greeting', { name: booking.customerSnapshot?.name })}</p>
      <p>${t(bodyKey)}</p>
      
      <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${t('bookingReminder.details')}</h3>
        <p><strong>${t('bookingReminder.service')}:</strong> ${booking.serviceSnapshot?.name || 'N/A'}</p>
        <p><strong>${t('bookingReminder.date')}:</strong> ${formattedDate}</p>
        <p><strong>${t('bookingReminder.time')}:</strong> ${formattedTime}</p>
        ${booking.employeeId?.name ? `<p><strong>${t('bookingReminder.employee')}:</strong> ${booking.employeeId.name}</p>` : ''}
        ${booking.locationId?.formattedAddress ? `<p><strong>${t('bookingReminder.location')}:</strong> ${booking.locationId.formattedAddress}</p>` : ''}
      </div>
      
      <p>${t('bookingReminder.footer')}</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      
      <div style="color: #666; font-size: 12px;">
        <p><strong>${business.name}</strong></p>
        ${business.phone ? `<p>${t('common.phone')}: ${business.phone}</p>` : ''}
        <p style="margin-top: 10px;">${t('common.poweredBy')}</p>
      </div>
    </div>
  `;
  
  try {
    const transporter = createTransporter({});
    
    await transporter.sendMail({
      from: config.smtp.user,
      to: customerEmail,
      subject,
      html
    });
    
    logger.info(`Booking reminder (${reminderType}) email sent to ${customerEmail}`);
  } catch (error) {
    logger.error(`Failed to send booking reminder email:`, error);
  }
};

module.exports = {
  createTransporter,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendBookingReminder
};
