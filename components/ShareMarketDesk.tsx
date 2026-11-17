'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, CalendarOff, Plus } from 'lucide-react';
import { Language } from '@/lib/types';

export interface MarketPick {
  id: string;
  symbol: string;
  segment: 'equity' | 'options' | 'futures';
  action: 'BUY' | 'SELL';
  strikePrice: string;
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  noteMr: string;
  noteEn: string;
  authorId: string;
  createdAt: string;
  isFromCms?: boolean;
}

export const SEED_MARKET_PICKS: MarketPick[] = [
  {
    id: 'pick-1',
    symbol: 'TATASTEEL',
    segment: 'equity',
    action: 'BUY',
    strikePrice: 'Cash / Delivery',
    entryPrice: '₹154.50',
    targetPrice: '₹166.00',
    stopLoss: '₹149.00',
    noteMr: 'मजबूत व्हॉल्यूम ब्रेकआउट; पायाभूत क्षेत्रातील मागणीमुळे तेजीची शक्यता.',
    noteEn: 'Strong volume breakout above 20-DMA supported by domestic steel demand.',
    authorId: 'seed',
    createdAt: '2026-11-17T03:45:00Z',
  },
  {
    id: 'pick-2',
    symbol: 'HDFCBANK',
    segment: 'equity',
    action: 'BUY',
    strikePrice: 'Cash / Swing',
    entryPrice: '₹1,725',
    targetPrice: '₹1,790',
    stopLoss: '₹1,695',
    noteMr: 'बँकिंग निर्देशांकात संस्थात्मक खरेदी; मध्यम कालावधीसाठी सकारात्मक.',
    noteEn: 'Institutional accumulation visible near key support; positive swing setup.',
    authorId: 'seed',
    createdAt: '2026-11-17T03:45:00Z',
  },
  {
    id: 'pick-3',
    symbol: 'NIFTY 50',
    segment: 'options',
    action: 'BUY',
    strikePrice: '24500 CE (Weekly)',
    entryPrice: '₹142',
    targetPrice: '₹198',
    stopLoss: '₹112',
    noteMr: '२४,४२० च्या वर टिकल्यास शॉर्ट कव्हरिंग रॅलीची शक्यता.',
    noteEn: 'Bullish momentum above 24,420 spot; watch for intraday short-covering.',
    authorId: 'seed',
    createdAt: '2026-11-17T03:50:00Z',
  },
  {
    id: 'pick-4',
    symbol: 'BANKNIFTY',
    segment: 'options',
    action: 'SELL',
    strikePrice: '52200 PE (Weekly)',
    entryPrice: '₹215',
    targetPrice: '₹110',
    stopLoss: '₹270',
    noteMr: '५२,००० स्तरावर भक्कम पुट रायटिंग सपोर्ट; ऑप्शन विक्रीसाठी अनुकूल.',
    noteEn: 'Heavy put writing support at 52,000; favorable theta decay setup.',
    authorId: 'seed',
    createdAt: '2026-11-17T03:55:00Z',
  },
  {
    id: 'pick-5',
    symbol: 'RELIANCE FUT',
    segment: 'futures',
    action: 'BUY',
    strikePrice: 'Current Month Fut',
    entryPrice: '₹1,318',
    targetPrice: '₹1,365',
    stopLoss: '₹1,294',
    noteMr: 'फ्युचर्स ओपन इंटरेस्टमध्ये वाढ; वरच्या पातळीवर ब्रेकआउट.',
    noteEn: 'Long build-up in current month futures with rising open interest.',
    authorId: 'seed',
    createdAt: '2026-11-17T04:00:00Z',
  },
];

// Official Indian NSE/BSE Trading Holidays (MM-DD)
const INDIAN_MARKET_HOLIDAYS: Record<string, { en: string; mr: string }> = {
  '01-26': { en: 'Republic Day', mr: 'प्रजासत्ताक दिन' },
  '03-14': { en: 'Holi', mr: 'होळी' },
  '04-14': { en: 'Dr. Babasaheb Ambedkar Jayanti', mr: 'डॉ. बाबासाहेब आंबेडकर जयंती' },
  '05-01': { en: 'Maharashtra Day', mr: 'महाराष्ट्र दिन' },
  '08-15': { en: 'Independence Day', mr: 'स्वातंत्र्य दिन' },
  '10-02': { en: 'Mahatma Gandhi Jayanti', mr: 'महात्मा गांधी जयंती' },
  '11-08': { en: 'Diwali Laxmi Pujan', mr: 'दिवाळी लक्ष्मीपूजन' },
  '11-24': { en: 'Gurunanak Jayanti', mr: 'गुरू नानक जयंती' },
  '12-25': { en: 'Christmas', mr: 'नाताळ' },
};

function getIndianMarketHolidayStatus(): { isHoliday: boolean; reasonEn: string; reasonMr: string } {
  const now = new Date();
  const istParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const weekday = istParts.find((p) => p.type === 'weekday')?.value || '';
  const month = istParts.find((p) => p.type === 'month')?.value || '';
  const day = istParts.find((p) => p.type === 'day')?.value || '';
  const mmdd = `${month}-${day}`;

  if (INDIAN_MARKET_HOLIDAYS[mmdd]) {
    return {
      isHoliday: true,
      reasonEn: `Indian Trading Holiday (${INDIAN_MARKET_HOLIDAYS[mmdd].en}) — NSE & BSE Markets Closed Today`,
      reasonMr: `भारतीय शेअर बाजार सुट्टी (${INDIAN_MARKET_HOLIDAYS[mmdd].mr}) — आज NSE व BSE बाजार बंद आहेत`,
    };
  }

  if (weekday === 'Sat' || weekday === 'Sun') {
    return {
      isHoliday: true,
      reasonEn: `Indian Trading Holiday (${weekday === 'Sat' ? 'Saturday' : 'Sunday'}) — NSE & BSE Markets Closed`,
      reasonMr: `भारतीय शेअर बाजार सुट्टी (${weekday === 'Sat' ? 'शनिवार' : 'रविवार'}) — आज NSE व BSE बाजार बंद आहेत`,
    };
  }

  return { isHoliday: false, reasonEn: '', reasonMr: '' };
}

interface ShareMarketDeskProps {
  picks: MarketPick[];
  lang: Language;
  onQuickAddMarket: () => void;
}

export function ShareMarketDesk({ picks, lang, onQuickAddMarket }: ShareMarketDeskProps) {
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'equity' | 'options' | 'futures'>('all');
  const holiday = getIndianMarketHolidayStatus();

  const filtered =
    segmentFilter === 'all' ? picks : picks.filter((p) => p.segment === segmentFilter);

  return (
    <section id="share-market" className="py-10 border-t-2 border-stone-300 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#8B0000] tracking-wide uppercase">
            {lang === 'mr'
              ? 'दैनिक शेअर बाजार व F&O कक्ष · NSE / BSE'
              : 'Daily Share Market & F&O Desk · NSE / BSE'}
          </p>
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
            {lang === 'mr'
              ? 'आजचे फायदेशीर शेअर्स, ऑप्शन स्ट्राइक प्राइस व फ्युचर्स टिप्स'
              : 'Day-Wise Profitable Shares, Option Strike Prices & Futures Ideas'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-0.5 bg-stone-200/80 rounded">
            {(
              [
                { id: 'all', mr: 'सर्व', en: 'All' },
                { id: 'equity', mr: 'शेअर्स', en: 'Shares' },
                { id: 'options', mr: 'ऑप्शन (CE/PE)', en: 'Options' },
                { id: 'futures', mr: 'फ्युचर्स', en: 'Futures' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSegmentFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  segmentFilter === tab.id
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {lang === 'mr' ? tab.mr : tab.en}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onQuickAddMarket}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 border border-emerald-700/40 hover:bg-emerald-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'mr' ? 'अपडेट' : 'Update'}</span>
          </button>
        </div>
      </div>

      {/* Indian Trading Holiday Banner (shown automatically on weekends & NSE/BSE holidays) */}
      {holiday.isHoliday && (
        <div
          suppressHydrationWarning
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 text-amber-950"
        >
          <CalendarOff className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              {lang === 'mr' ? holiday.reasonMr : holiday.reasonEn}
            </p>
            <p className="text-xs text-amber-800">
              {lang === 'mr'
                ? 'पुढील ट्रेडिंग सत्रासाठी संपादकीय विश्लेषण व स्ट्राइक प्राइस खालीलप्रमाणे आहेत.'
                : 'Showing latest editorial watchlist and strike levels prepared for the next trading session.'}
            </p>
          </div>
        </div>
      )}

      {/* Share & F&O Table */}
      <div className="overflow-x-auto bg-white border border-stone-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-[#F3EFE8] text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
              <th className="py-3 px-4">{lang === 'mr' ? 'शेअर / इंडेक्स' : 'Stock / Index'}</th>
              <th className="py-3 px-4">{lang === 'mr' ? 'स्ट्राइक प्राइस / प्रकार' : 'Strike Price / Segment'}</th>
              <th className="py-3 px-4">{lang === 'mr' ? 'सल्ला' : 'Call'}</th>
              <th className="py-3 px-4">{lang === 'mr' ? 'एंट्री' : 'Entry'}</th>
              <th className="py-3 px-4">{lang === 'mr' ? 'टार्गेट' : 'Target'}</th>
              <th className="py-3 px-4">{lang === 'mr' ? 'स्टॉप-लॉस' : 'Stop-Loss'}</th>
              <th className="py-3 px-4">{lang === 'mr' ? 'विश्लेषण' : 'Analysis'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm">
            {filtered.map((pick) => {
              const isBuy = pick.action === 'BUY';
              return (
                <tr key={pick.id} className="hover:bg-[#FBF9F5] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-stone-900 whitespace-nowrap">
                    {pick.symbol}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-stone-700 font-mono whitespace-nowrap">
                    {pick.strikePrice}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        isBuy ? 'text-emerald-700' : 'text-[#8B0000]'
                      }`}
                    >
                      {isBuy ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {isBuy
                        ? lang === 'mr'
                          ? 'BUY (खरेदी)'
                          : 'BUY'
                        : lang === 'mr'
                        ? 'SELL (विक्री)'
                        : 'SELL'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-stone-900 whitespace-nowrap">
                    {pick.entryPrice}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                    {pick.targetPrice}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[#8B0000] whitespace-nowrap">
                    {pick.stopLoss}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-stone-600 min-w-[220px]">
                    {lang === 'mr' ? pick.noteMr : pick.noteEn}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-stone-500">
        {lang === 'mr'
          ? 'टीप: वरील शेअर बाजार व ऑप्शन ट्रेडिंग माहिती केवळ शैक्षणिक व संपादकीय अभ्यासासाठी आहे. गुंतवणूक करण्यापूर्वी SEBI नोंदणीकृत सल्लागाराचा सल्ला घ्या.'
          : 'Disclaimer: Share market, options, and futures ideas are published for educational and editorial information only. Consult a SEBI-registered financial advisor before trading.'}
      </p>
    </section>
  );
}
