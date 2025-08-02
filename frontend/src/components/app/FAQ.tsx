'use client';

import React, { useState } from 'react';

type FAQProps = {
  className?: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ: React.FC<FAQProps> = ({ className = '' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems: FAQItem[] = [
    {
      question: 'What is Cirqa Scholarship Platform?',
      answer: 'Cirqa is a decentralized platform that connects students seeking educational funding with investors who want to support education while earning rewards in the form of CIRQA tokens.'
    },
    {
      question: 'How do I create a scholarship?',
      answer: 'As a student, you can create a scholarship by clicking the "Create New Scholarship" button, providing an IPFS metadata hash containing your information, and submitting the transaction. You\'ll receive an NFT representing your scholarship.'
    },
    {
      question: 'How do I fund a scholarship?',
      answer: 'As an investor, you can browse available scholarships and click the "Fund" button on any scholarship you wish to support. Enter the amount of USDT you want to contribute and confirm the transaction. You\'ll receive CIRQA tokens as a reward.'
    },
    {
      question: 'How do students withdraw funds?',
      answer: 'Students who own a scholarship can click the "Withdraw" button on their scholarship card, enter the amount they wish to withdraw, and confirm the transaction. The USDT will be transferred to their wallet.'
    },
    {
      question: 'What is the reward rate?',
      answer: 'The reward rate determines how many CIRQA tokens investors receive for each USDT they contribute to scholarships. This rate may be adjusted by the protocol governance.'
    },
    {
      question: 'What is IPFS and why is it used?',
      answer: 'IPFS (InterPlanetary File System) is a decentralized storage system. We use it to store scholarship metadata (student information) in a decentralized way, ensuring that the data remains accessible and tamper-proof.'
    },
    {
      question: 'Is there a fee for using the platform?',
      answer: 'The platform itself doesn\'t charge fees beyond the standard blockchain transaction fees. 100% of the USDT funded goes directly to the student\'s scholarship balance.'
    }
  ];

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
      
      <div className="space-y-3">
        {faqItems.map((item, index) => (
          <div key={index} className="border-b border-gray-700 pb-3 last:border-b-0 last:pb-0">
            <button
              onClick={() => toggleQuestion(index)}
              className="w-full text-left flex justify-between items-center py-2 focus:outline-none"
            >
              <span className="font-medium">{item.question}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${openIndex === index ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {openIndex === index && (
              <div className="mt-2 text-sm text-gray-400 pl-2 pr-6">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;