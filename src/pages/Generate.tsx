import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Wand2, Sparkles } from 'lucide-react';

const Generate = () => {
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
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 blur-3xl opacity-30"
            >
              <div className="w-32 h-32 bg-gradient-primary rounded-full" />
            </motion.div>
            <Wand2 className="h-24 w-24 text-primary relative z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              {t('nav.generate')}
            </h1>
            <p className="text-xl text-muted-foreground">
              AI generation interface coming soon. Create stunning images with our models.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Select a model from the browse page to start generating</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Generate;
