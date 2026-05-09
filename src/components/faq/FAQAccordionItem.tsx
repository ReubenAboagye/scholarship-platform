"use client";

import { useState } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
  isFirst?: boolean;
}

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

export default function FAQAccordionItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LazyMotion features={domAnimation}>
      <div className="border-b border-zinc-100 last:border-0 group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left outline-none group-hover:bg-zinc-50/50 transition-colors px-2 -mx-2 rounded-lg"
      >
        <span 
          className="font-semibold text-zinc-900 text-base md:text-lg leading-snug"
          style={SERIF}
        >
          {question}
        </span>
        <m.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex-shrink-0 ml-4 size-5 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-400 group-hover:text-brand-600 transition-colors"
        >
          <ChevronDown className="size-4" />
        </m.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 pr-8 text-sm text-zinc-600 leading-relaxed font-light">
              {answer}
            </div>
          </m.div>
        )}
      </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
