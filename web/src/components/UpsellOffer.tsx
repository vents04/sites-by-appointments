import { AnimatePresence, motion } from "framer-motion";
import moment from "moment-timezone";
import { TbCalendarCheck, TbCalendarPlus, TbClock, TbUser, TbX } from "react-icons/tb";
import { LoadingSpinner } from "./LoadingSpinner";

export type UpsellOfferData = {
    upsell: { _id: string, title?: string, description?: string },
    service: { _id: string, name: string, price: number, currency: string },
    employee: { _id: string, name: string },
    startDt: string,
    endDt: string,
};

const formatPrice = (price: number, currency: string) => currency === "€" ? `€${price}` : `${price}${currency}`;

export const UpsellOffer = (props: {
    offer: UpsellOfferData | null,
    status: "offer" | "confirm" | "booking" | "booked",
    onAccept: () => void,
    onConfirm: () => void,
    onBack: () => void,
    onClose: () => void,
}) => {
    const { offer, status } = props;
    const timezone = moment.tz.guess();
    const start = offer ? moment(offer.startDt).tz(timezone) : null;
    const end = offer ? moment(offer.endDt).tz(timezone) : null;
    const minutes = start && end ? end.diff(start, "minutes") : 0;

    return (
        <AnimatePresence>
            {
                offer && start && end
                ? <motion.div
                    key="upsell-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
                    onClick={status === "booking" ? undefined : props.onClose}
                  >
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={offer.upsell.title || offer.service.name}
                        className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-[#252523] shadow-2xl ring-1 ring-[#c59452]/40 sm:rounded-2xl"
                    >
                        <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#c59452]/20 blur-2xl" />

                        {
                            status !== "booking"
                            ? <button
                                type="button"
                                onClick={props.onClose}
                                aria-label="Затвори"
                                className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white/80 transition-colors hover:text-white"
                              >
                                <TbX size={18} />
                              </button>
                            : null
                        }

                        <div className="relative h-36 w-full">
                            <img src="/book/facial-massage.webp" alt={offer.service.name} className="h-full w-full object-cover" />
                            <span className="absolute inset-0 bg-gradient-to-t from-[#252523] via-[#252523]/30 to-transparent" />
                            <span className="absolute bottom-3 left-5 inline-flex items-center gap-1.5 rounded-full bg-[#c59452] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#252523]">
                                {status === "booked" ? "Добавено" : status === "offer" ? "Специално предложение" : "Потвърждение"}
                            </span>
                        </div>

                        <div className="relative px-5 pb-6 pt-3">
                            {
                                status === "booked"
                                ? <>
                                    <p className="flex items-center gap-2 text-lg font-semibold leading-tight text-white">
                                        <TbCalendarCheck size={22} className="flex-shrink-0 text-[#c59452]" />
                                        Записахме ви и за {offer.service.name.toLowerCase()}!
                                    </p>
                                    <p className="mt-2 text-sm text-white/70">
                                        Очакваме ви в {start.format("HH:mm")} ч. при {offer.employee.name}, веднага след основния ви час. Ще получите потвърждение и на имейла си.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={props.onClose}
                                        className="mt-5 w-full rounded bg-[#c59452] py-3 text-sm font-bold text-[#252523] shadow transition-colors duration-200 hover:bg-[#d4a868]"
                                    >
                                        Готово
                                    </button>
                                  </>
                                : status === "confirm" || status === "booking"
                                ? <>
                                    <p className="text-lg font-semibold leading-tight text-white">
                                        Потвърдете допълнителния час
                                    </p>
                                    <dl className="mt-4 space-y-2 rounded-lg bg-black/25 p-4 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-white/50">Услуга</dt>
                                            <dd className="text-right font-semibold text-white">{offer.service.name}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-white/50">При</dt>
                                            <dd className="text-right text-white">{offer.employee.name}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-white/50">Дата и час</dt>
                                            <dd className="text-right text-white">{start.format("DD/MM/YYYY")}, {start.format("HH:mm")} – {end.format("HH:mm")}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-white/50">Цена</dt>
                                            <dd className="text-right font-semibold text-[#c59452]">{formatPrice(offer.service.price, offer.service.currency)}</dd>
                                        </div>
                                    </dl>

                                    <button
                                        type="button"
                                        disabled={status === "booking"}
                                        onClick={props.onConfirm}
                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-[#c59452] py-3 text-sm font-bold text-[#252523] shadow transition-colors duration-200 hover:bg-[#d4a868] disabled:opacity-70"
                                    >
                                        {
                                            status === "booking"
                                            ? <LoadingSpinner className="text-[#252523]" size={18} />
                                            : <TbCalendarCheck size={18} />
                                        }
                                        Потвърди и запиши
                                    </button>
                                    <button
                                        type="button"
                                        disabled={status === "booking"}
                                        onClick={props.onBack}
                                        className="mt-4 w-full rounded border border-white/20 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50"
                                    >
                                        Назад
                                    </button>
                                  </>
                                : <>
                                    <p className="text-lg font-semibold leading-tight text-white">
                                        {offer.upsell.title || `Добавете ${offer.service.name}`}
                                    </p>
                                    <p className="mt-2 text-sm text-white/70">
                                        {offer.upsell.description || `${offer.employee.name} е свободна веднага след вашия час.`}
                                    </p>

                                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-black/25 p-3 text-xs text-white/80">
                                        <span className="flex items-center gap-1.5">
                                            <TbClock size={16} className="flex-shrink-0 text-[#c59452]" />
                                            {start.format("HH:mm")} – {end.format("HH:mm")}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <TbUser size={16} className="flex-shrink-0 text-[#c59452]" />
                                            {offer.employee.name}
                                        </span>
                                        <span className="text-right">
                                            {minutes} мин <span className="mx-0.5 text-white/30">•</span> <span className="font-semibold text-[#c59452]">{formatPrice(offer.service.price, offer.service.currency)}</span>
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={props.onAccept}
                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-[#c59452] py-3 text-sm font-bold text-[#252523] shadow transition-colors duration-200 hover:bg-[#d4a868]"
                                    >
                                        <TbCalendarPlus size={18} />
                                        Добави за {formatPrice(offer.service.price, offer.service.currency)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={props.onClose}
                                        className="mt-4 w-full py-2 text-xs font-semibold text-white/50 transition-colors hover:text-white/80"
                                    >
                                        Не, благодаря
                                    </button>
                                  </>
                            }
                        </div>
                    </motion.div>
                  </motion.div>
                : null
            }
        </AnimatePresence>
    );
};
