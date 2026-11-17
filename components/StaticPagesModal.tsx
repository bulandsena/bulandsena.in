'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Language } from '@/lib/types';

export type StaticPageId = 'about' | 'contact' | 'privacy' | 'terms' | 'editorial';

interface StaticPagesModalProps {
  pageId: StaticPageId | null;
  lang: Language;
  onClose: () => void;
}

const PAGES: Record<
  StaticPageId,
  {
    titleMr: string;
    titleEn: string;
    bodyMr: string[];
    bodyEn: string[];
  }
> = {
  about: {
    titleMr: 'आमच्याबद्दल — दैनिक बुलंदसेना वृत्तपत्रिका',
    titleEn: 'About Us — Dainik Bulandsena Vrittapatrika',
    bodyMr: [
      'दैनिक बुलंदसेना वृत्तपत्रिका (bulandsena.in) हे महाराष्ट्रातील स्वतंत्र, निर्भीड आणि जबाबदार स्थानिक पत्रकारितेसाठी समर्पित डिजिटल वृत्तपत्र व्यासपीठ आहे.',
      'स्थानिक स्वराज्य संस्था, कृषी बाजारभाव, पायाभूत सुविधा, शिक्षण आणि सामान्य नागरिकांचे प्रश्न यांना प्राधान्य देणे हे आमचे मुख्य ध्येय आहे. आमचे प्रतिनिधी जिल्ह्यातील प्रत्येक तालुक्यातून सत्यापित बातम्या, थेट अपडेट्स आणि मैदानी व्हिडिओ रिपोर्ट्स सादर करतात.',
    ],
    bodyEn: [
      'Dainik Bulandsena Vrittapatrika (bulandsena.in) is an independent Marathi and English digital newspaper dedicated to accountable local journalism across Maharashtra.',
      'Our newsroom prioritizes civic governance, agricultural markets, infrastructure, education, and grassroots public interest reporting through verified dispatches, live updates, and field video journalism.',
    ],
  },
  contact: {
    titleMr: 'संपर्क — संपादकीय व जाहिरात कक्ष',
    titleEn: 'Contact Us — Editorial & Advertising Desk',
    bodyMr: [
      'बातमी देण्यासाठी, प्रतिक्रिया कळवण्यासाठी किंवा जाहिरात प्रसिद्ध करण्यासाठी आमच्या संपादकीय कक्षाशी थेट संपर्क साधा:',
      'अधिकृत ईमेल: dainikbulandsena@gmail.com',
      'वेबसाइट: https://bulandsena.in',
      'संपादकीय कक्ष वेळ: सोमवार ते रविवार, सकाळी ७:०० ते रात्री १०:०० (IST)',
    ],
    bodyEn: [
      'For news tips, reader corrections, press releases, or advertising inquiries, please reach our editorial desk directly:',
      'Official Email: dainikbulandsena@gmail.com',
      'Website: https://bulandsena.in',
      'Newsroom Hours: Monday to Sunday, 7:00 AM – 10:00 PM IST',
    ],
  },
  privacy: {
    titleMr: 'गोपनीयता धोरण (Privacy Policy)',
    titleEn: 'Privacy Policy',
    bodyMr: [
      'दैनिक बुलंदसेना वृत्तपत्रिका वाचकांच्या वैयक्तिक माहितीच्या गोपनीयतेचा पूर्ण सन्मान करते. वृत्तपत्रिका सदस्यतेसाठी (Newsletter) दिलेला ईमेल पत्ता केवळ दैनिक बातम्या पाठवण्यासाठीच वापरला जातो.',
      'आम्ही वाचकांची कोणतीही वैयक्तिक माहिती तृतीय पक्षांना विकत किंवा सामायिक करत नाही. तुम्ही कधीही dainikbulandsena@gmail.com वर ईमेल करून तुमची सदस्यता रद्द करू शकता.',
    ],
    bodyEn: [
      'Dainik Bulandsena Vrittapatrika respects reader privacy. Email addresses submitted for the Morning Brief newsletter are used solely to deliver editorial dispatches.',
      'We do not sell or rent personal reader data to third parties. Subscribers may request removal at any time by writing to dainikbulandsena@gmail.com.',
    ],
  },
  terms: {
    titleMr: 'अटी व शर्ती (Terms & Conditions)',
    titleEn: 'Terms & Conditions',
    bodyMr: [
      'bulandsena.in वर प्रकाशित सर्व लेख, छायाचित्रे आणि व्हिडिओ रिपोर्ट्स हे दैनिक बुलंदसेना वृत्तपत्रिकेच्या कॉपीराइट अंतर्गत सुरक्षित आहेत. पूर्वपरवानगीशिवाय व्यावसायिक पुनर्प्रकाशनास मनाई आहे.',
      'जाहिरात विभागातील मजकूर व दावे संबंधित प्रायोजकांच्या जबाबदारीवर प्रकाशित केले जातात. संपादकीय मजकुरातील कोणत्याही दुरुस्तीसाठी कृपया आमच्या संपर्क पृष्ठावर कळवा.',
    ],
    bodyEn: [
      'All articles, photographs, and video reports published on bulandsena.in are protected under copyright by Dainik Bulandsena Vrittapatrika. Commercial republication without written consent is prohibited.',
      'Sponsored notices and third-party advertisements are clearly labeled and remain the responsibility of the respective advertiser.',
    ],
  },
  editorial: {
    titleMr: 'संपादकीय धोरण व जाहिरात (Editorial Policy & Advertise)',
    titleEn: 'Editorial Policy & Advertising Guidelines',
    bodyMr: [
      'दैनिक बुलंदसेना वृत्तपत्रिका निष्पक्षता, तथ्य पडताळणी आणि पत्रकारिता नैतिकतेचे काटेकोर पालन करते. प्रत्येक स्थानिक बातमी दोन स्वतंत्र स्रोतांकडून पडताळूनच प्रकाशित केली जाते.',
      'स्थानिक व्यवसाय, सहकारी संस्था आणि शैक्षणिक उपक्रमांसाठी साइडबार (300×250) व लेखाच्या तळाशी जाहिरात जागा उपलब्ध आहेत. संपर्क: dainikbulandsena@gmail.com.',
    ],
    bodyEn: [
      'Dainik Bulandsena Vrittapatrika upholds strict verification, fairness, and independence between newsroom reporting and commercial sponsorships.',
      'Sidebar (300×250) and article-footer placements are available for regional enterprises and institutions. Contact dainikbulandsena@gmail.com for rate cards.',
    ],
  },
};

export function StaticPagesModal({ pageId, lang, onClose }: StaticPagesModalProps) {
  if (!pageId) return null;
  const page = PAGES[pageId];
  const title = lang === 'mr' ? page.titleMr : page.titleEn;
  const paragraphs = lang === 'mr' ? page.bodyMr : page.bodyEn;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] border border-stone-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#8B0000]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-900"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4 text-sm sm:text-base text-stone-800 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-[#8B0000] hover:bg-[#6B0000]"
          >
            {lang === 'mr' ? 'बंद करा' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
