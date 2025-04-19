import { motion } from 'framer-motion';
import Link from 'next/link';

import { MessageIcon, VercelIcon, ThumbUpIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col gap-2 items-center text-center text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <ThumbUpIcon size={14} />
          <span>Its very important to vote on each message to help make the benchmark more accurate</span>
        </div>
      </div>
    </motion.div>
  );
};
