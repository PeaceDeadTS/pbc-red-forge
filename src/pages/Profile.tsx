import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 max-w-2xl mx-auto min-h-[60vh] flex flex-col items-center justify-center"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 blur-3xl opacity-30"
            >
              <div className="w-32 h-32 bg-gradient-secondary rounded-full" />
            </motion.div>
            <User className="h-24 w-24 text-secondary relative z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              {t('nav.profile')}
            </h1>
            <p className="text-xl text-muted-foreground">
              User profiles and galleries coming soon. Sign in to manage your creations.
            </p>
          </div>

          <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow">
            <Settings className="mr-2 h-5 w-5" />
            {t('nav.signIn')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
