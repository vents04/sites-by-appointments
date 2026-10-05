import { motion } from "framer-motion";
import { TbArrowRight, TbCalendarPlus, TbClock } from "react-icons/tb";

const PROMO_URL = "https://kerelski.com/#facial-massage";

export const FACIAL_MASSAGE_SERVICE_ID = "6ac3972cbb425b09b3efb43d";

export const FacialMassagePromo = (props: { onBook?: () => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative mx-4 mt-6 flex min-h-28 items-stretch overflow-hidden rounded-lg bg-[#252523] shadow-lg ring-1 ring-[#c59452]/40"
        >
            <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#c59452]/20 blur-2xl" />
            <span className="promo-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <img
                src="/book/facial-massage.webp"
                alt="Премиум лицев масаж"
                className="w-24 flex-shrink-0 self-stretch object-cover"
            />

            <div className="relative min-w-0 flex-1 self-center px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c59452] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#252523]">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#252523] opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#252523]" />
                    </span>
                    Ново
                </span>
                <p className="mt-1.5 text-base font-semibold leading-tight text-white">
                    Премиум лицев масаж
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
                    <TbClock size={14} className="text-[#c59452]" />
                    30 мин
                    <span className="mx-1 text-white/30">•</span>
                    <span className="font-semibold text-[#c59452]">€20</span>
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {
                        props.onBook
                        ? <button
                            type="button"
                            onClick={props.onBook}
                            className="inline-flex items-center gap-1.5 rounded bg-[#c59452] px-3 py-1.5 text-xs font-bold text-[#252523] shadow transition-colors duration-200 hover:bg-[#d4a868]"
                          >
                            <TbCalendarPlus size={14} />
                            Запиши час
                          </button>
                        : null
                    }
                    <a
                        href={PROMO_URL}
                        className="group inline-flex items-center gap-1 text-xs font-semibold text-[#c59452]"
                    >
                        Научи повече
                        <TbArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
