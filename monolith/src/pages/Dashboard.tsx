import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Layout } from '../components/Layout';
import { FeedbackAnalysisPage } from './FeedbackAnalysisPage';
import { EmailAnalysisPage } from './EmailAnalysisPage';
import { HistoryPage } from './HistoryPage';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Email Analysis');

  const renderContent = () => {
    switch (activeTab) {
      case 'Feedback Analysis':
        return <FeedbackAnalysisPage />;
      case 'Email Analysis':
        return <EmailAnalysisPage />;
      case 'History':
        return <HistoryPage />;
      case 'Profile':
        return <ProfilePage />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <EmailAnalysisPage />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <main className="py-12 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </Layout>
  );
};
