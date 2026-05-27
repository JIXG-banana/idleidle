import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const RebirthConfirmModal = ({ onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        >
          <h2 className="text-2xl font-black mb-4 text-gray-800">
            【警告: 世界の再コーディング】
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            本当に実行しますか？現在の進行状況はすべて消去され、新たな宇宙が構築されます。
            <br />
            (※現時点では演出のみが実行されます)
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
            >
              承認して再コーディング
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition-all active:scale-95"
            >
              キャンセル
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RebirthConfirmModal;