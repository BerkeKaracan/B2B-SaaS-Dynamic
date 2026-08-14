'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';

// BoardRenderer'dan gelen prop'ları tanımlıyoruz
interface CalendarBoardProps {
  projectId: string;
}

export default function CalendarBoard({ projectId }: CalendarBoardProps) {
  // 1. DURUM (STATE) YÖNETİMİ
  // Takvimin o an hangi ayı ve yılı gösterdiğini tutuyoruz. Başlangıç: Bugün.
  const [currentDate, setCurrentDate] = useState(new Date());

  // 2. MATEMATİK VE TARİH HESAPLAMALARI
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = new Date();

  // Bir sonraki ayın 0. günü, bulunduğumuz ayın son gününü verir (Örn: 28, 30, 31).
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Ayın 1. gününün haftanın hangi gününe denk geldiğini buluyoruz.
  // getDay() normalde Pazar'ı 0 kabul eder. Biz Pazartesi'yi 1. gün yapmak için küçük bir dönüşüm yapıyoruz.
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startingEmptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Ay isimleri
  const monthNames = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  // 3. KONTROL FONKSİYONLARI
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 4. ARAYÜZ (UI) OLUŞTURMA
  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      {/* Üst Bilgi Çubuğu (Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-sm text-zinc-500">
              Proje Kimliği:{' '}
              <span className="font-mono text-xs">{projectId}</span>
            </p>
          </div>
        </div>

        {/* Ay Değiştirme Butonları */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
            title="Önceki Ay"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
          >
            Bugün
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
            title="Sonraki Ay"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Takvim Ana Gövdesi (Grid) */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Haftanın Günleri */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Gün Hücreleri */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {/* Ayın 1'inden önceki boş hücreler */}
          {Array.from({ length: startingEmptyCells }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border-b border-r border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/30"
            />
          ))}

          {/* Ayın geçerli günleri */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNumber = index + 1;
            // Bugünün tarihini vurgulamak için kontrol ediyoruz
            const isToday =
              dayNumber === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            return (
              <div
                key={dayNumber}
                className="group relative border-b border-r border-zinc-100 dark:border-zinc-800/50 p-2 sm:p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer flex flex-col"
                onClick={() =>
                  console.log(
                    `${dayNumber} ${monthNames[currentMonth]} tıklandı!`
                  )
                }
              >
                {/* Gün Numarası */}
                <div className="flex justify-between items-start">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : 'text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                    }`}
                  >
                    {dayNumber}
                  </span>
                </div>

                {/* Etkinliklerin (Events) listeleneceği boş alan */}
                <div className="flex-1 mt-1 overflow-y-auto">
                  {/* İleride etkinlikler buraya map() ile eklenecek */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
