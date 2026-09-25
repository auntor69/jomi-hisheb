/**
 * UI strings — MASTERPLAN §11.
 * One flat map per language (~40 keys), no i18n library. Each key is fully
 * translated; never mix languages within one string. Unit names come from
 * the registry (units.ts), not from here.
 */

export type Lang = "en" | "bn";

export const STRINGS = {
  en: {
    brandEn: "Jomi Hisheb",
    brandBn: "জমির হিসাব",
    title: "Jomi Hisheb — Bangladesh Land Unit Converter",
    subtitle:
      "Convert katha, bigha, chotak, shotangsho, decimal, gonda, kani, acre, square feet and square meters instantly.",
    inputLabel: "Value",
    fromUnitLabel: "From unit",
    toUnitLabel: "To unit",
    resultLabel: "Result",
    swap: "Swap units",
    copy: "Copy",
    copied: "Copied ✓",
    copyFailed: "Copy failed",
    resultPlaceholder: "—",
    errNegative: "Land area cannot be negative.",
    errNotANumber: "Enter a valid number.",
    errOverflow: "Value is too large.",
    quickTitle: "Quick conversions",
    quickAria: "Set conversion from {from} to {to}",
    aboutTitle: "About these units",
    aboutP1:
      "In the Bangladesh convention, 1 katha equals 720 square feet, and 20 katha make 1 bigha (14,400 square feet). These are the values used by this converter.",
    aboutP2:
      "Shotangsho (also called shotok) and decimal are the same unit: 1 decimal = 435.6 square feet = exactly one hundredth of an acre. So 1 acre = 100 decimal.",
    aboutP3:
      "Square meters use the international standard: 1 m² = 10.7639104167 sq ft.",
    aboutP4:
      "Kani comes in two standards: the '20 Gonda' Kani = 17,280 sq ft (1 gonda = 864 sq ft), and the '40 Shotok' Kani = 17,424 sq ft. Also: 1 chotak = 45 sq ft (16 per katha). Regional note: katha and bigha vary outside Bangladesh — this tool uses the Bangladesh standard.",
    faqTitle: "FAQ",
    faq1q: "Are these values official for Bangladesh?",
    faq1a: "They follow the commonly used Bangladesh convention. Actual deeds and surveys should always be checked against official documents.",
    faq2q: "Why do other sites show different katha values?",
    faq2a: "Katha and bigha vary by region and history. Some Indian calculators use 1 katha = 1,361.25 sq ft (the Bihar standard). This converter uses the Bangladesh standard: 1 katha = 720 sq ft.",
    faq3q: "Is shotangsho the same as decimal?",
    faq3a: "Yes. Shotangsho (শতাংশ, also called shotok) and decimal both equal 435.6 sq ft, one hundredth of an acre.",
    faq4q: "Is this a legal measurement tool?",
    faq4a: "No. This is a calculator aid. It does not determine legal ownership, cadastral boundaries, or official survey measurements.",
    faq5q: "Does anything I type get sent anywhere?",
    faq5a: "No. All conversion happens in your browser. Nothing is sent to any server, and there are no ads or trackers.",
    faq6q: "Which Kani does this use?",
    faq6a: "Bangladesh uses two Kani standards. The '20 Gonda' Kani (8-hat-nol system) is 17,280 sq ft; the '40 Shotok' Kani is 17,424 sq ft (about 0.8% larger). This tool offers both as separate units — pick the one your deed or local practice uses.",
    footerDisclaimer:
      "Uses the Bangladesh land-unit convention. Not a legal survey tool.",
    footerTag: "Built for Bangladesh · No ads · No tracking",
    langLabel: "Language",
  },
  bn: {
    brandEn: "Jomi Hisheb",
    brandBn: "জমির হিসাব",
    title: "জমির হিসাব — জমির পরিমাপ রূপান্তরক",
    subtitle:
      "কাঠা, বিঘা, ছটাক, শতাংশ, ডেসিমেল, গন্ডা, কানি, একর, বর্গফুট ও বর্গমিটার — সাথে সাথে রূপান্তর করুন।",
    inputLabel: "মান",
    fromUnitLabel: "যে একক থেকে",
    toUnitLabel: "যে এককে",
    resultLabel: "ফলাফল",
    swap: "একক অদল-বদল করুন",
    copy: "কপি",
    copied: "কপি হয়েছে ✓",
    copyFailed: "কপি করা যায়নি",
    resultPlaceholder: "—",
    errNegative: "জমির পরিমাণ ঋণাত্মক হতে পারে না।",
    errNotANumber: "সঠিক সংখ্যা লিখুন।",
    errOverflow: "মান অতিরিক্ত বড়।",
    quickTitle: "দ্রুত রূপান্তর",
    quickAria: "{from} থেকে {to} রূপান্তর নির্বাচন করুন",
    aboutTitle: "এককগুলো সম্পর্কে",
    aboutP1:
      "বাংলাদেশের প্রচলিত হিসাবে ১ কাঠা = ৭২০ বর্গফুট এবং ২০ কাঠা = ১ বিঘা (১৪,৪০০ বর্গফুট)। এই রূপান্তরকে এই মানগুলোই ব্যবহৃত হয়।",
    aboutP2:
      "শতাংশ (শতক) ও ডেসিমেল একই একক: ১ ডেসিমেল = ৪৩৫.৬ বর্গফুট = ঠিক এক একরের শতভাগের একভাগ। অর্থাৎ ১ একর = ১০০ ডেসিমেল।",
    aboutP3:
      "বর্গমিটার আন্তর্জাতিক মান অনুযায়ী: ১ বর্গমিটার = ১০.৭৬৩৯১০৪১৬৭ বর্গফুট।",
    aboutP4:
      "কানির দুটি মান প্রচলিত: '২০ গন্ডা' কানি = ১৭,২৮০ বর্গফুট (১ গন্ডা = ৮৬৪ বর্গফুট); '৪০ শতাংশ' কানি = ১৭,৪২৪ বর্গফুট। এছাড়া ১ ছটাক = ৪৫ বর্গফুট (১ কাঠায় ১৬টি)। বিভিন্ন অঞ্চলে কাঠা ও বিঘার মান ভিন্ন হতে পারে — এখানে বাংলাদেশের প্রচলিত মান ব্যবহৃত হয়েছে।",
    faqTitle: "সাধারণ জিজ্ঞাসা",
    faq1q: "এই মানগুলো কি বাংলাদেশের জন্য সরকারি?",
    faq1a: "এগুলো বাংলাদেশে প্রচলিত মান অনুযায়ী। দলিল বা জরিপের ক্ষেত্রে সরকারি কাগজের সঙ্গে মিলিয়ে দেখুন।",
    faq2q: "অন্য সাইটে কাঠার ভিন্ন মান দেখায় কেন?",
    faq2a: "কাঠা ও বিঘা অঞ্চলভেদে ভিন্ন হয়। কিছু ভারতীয় ক্যালকুলেটরে ১ কাঠা = ১,৩৬১.২৫ বর্গফুট (বিহারের মান) দেখানো হয়। এখানে বাংলাদেশের মান: ১ কাঠা = ৭২০ বর্গফুট।",
    faq3q: "শতাংশ ও ডেসিমেল কি একই?",
    faq3a: "হ্যাঁ। শতাংশ (শতক) ও ডেসিমেল দুটোই ৪৩৫.৬ বর্গফুট, অর্থাৎ এক একরের শতভাগের একভাগ।",
    faq4q: "এটি কি আইনি পরিমাপ যন্ত্র?",
    faq4a: "না। এটি কেবল হিসাবের সহায়ক। এটি দিয়ে মালিকানা, দাগ নম্বর বা সরকারি জরিপ নির্ধারণ করা যায় না।",
    faq5q: "আমি যা লিখি তা কি কোথাও পাঠানো হয়?",
    faq5a: "না। সব হিসাব আপনার ব্রাউজারেই হয়। কোনো সার্ভারে কিছু পাঠানো হয় না; বিজ্ঞাপন বা ট্র্যাকিংও নেই।",
    faq6q: "এখানে কোন কানি ব্যবহৃত হয়?",
    faq6a: "বাংলাদেশে কানির দুটি প্রচলিত মান আছে। '২০ গন্ডা' কানি (আট-হাত নল) = ১৭,২৮০ বর্গফুট; '৪০ শতাংশ' কানি = ১৭,৪২৪ বর্গফুট (প্রায় ০.৮% বড়)। দুটোই আলাদা একক হিসেবে দেওয়া আছে — দলিল বা স্থানীয় প্রথা অনুযায়ী বেছে নিন।",
    footerDisclaimer: "বাংলাদেশের প্রচলিত জমি একক অনুযায়ী। এটি আইনি জরিপ যন্ত্র নয়।",
    footerTag: "বাংলাদেশের জন্য নির্মিত · বিজ্ঞাপন নেই · ট্র্যাকিং নেই",
    langLabel: "ভাষা",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

/** Ensure BN has exactly the same keys as EN (compile-time contract). */
const _enKeys = Object.keys(STRINGS.en).sort().join("|");
const _bnKeys = Object.keys(STRINGS.bn).sort().join("|");
if (_enKeys !== _bnKeys) {
  throw new Error("i18n: EN and BN string maps have different keys");
}
