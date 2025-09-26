import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import MonthlyRankingSystem from '@/components/MonthlyRankingSystem';

export default function Rankings() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="মাসিক র‍্যাঙ্কিং সিস্টেম" 
          subtitle="GPA ভিত্তিক ছাত্র র‍্যাঙ্কিং এবং পারফরমেন্স ট্র্যাকিং" 
        />
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <MonthlyRankingSystem />
        </div>
      </main>
    </div>
  );
}