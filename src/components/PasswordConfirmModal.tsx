import React, { useState } from 'react';
import { ShieldAlert, Lock, X } from 'lucide-react';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  title?: string;
  actionType?: 'delete' | 'edit' | 'batch' | 'reset';
  itemDescription?: string;
  onConfirm: () => void;
  onCancel: () => void;
  expectedPassword?: string;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  title,
  actionType = 'delete',
  itemDescription = 'este item',
  onConfirm,
  onCancel,
  expectedPassword = '2025',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const isReset = actionType === 'reset';
  const isBatch = actionType === 'batch';
  const isEdit = actionType === 'edit';
  const modalTitle =
    title ||
    (isReset
      ? 'Confirmar Limpeza Geral de Cadastros'
      : isBatch
      ? 'Confirmar Cadastro em Lote'
      : isEdit
      ? 'Confirmar Edição com Senha'
      : 'Confirmar Exclusão com Senha');

  const actionText = isReset
    ? 'limpeza geral'
    : isBatch
    ? 'inclusão em lote'
    : isEdit
    ? 'edição'
    : 'exclusão';

  const confirmBtnText = isReset
    ? 'Confirmar Limpeza Geral'
    : isBatch
    ? 'Confirmar Lote'
    : isEdit
    ? 'Confirmar Edição'
    : 'Confirmar Exclusão';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      setError(false);
      setPassword('');
      onConfirm();
    } else {
      setError(true);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div
          className={`border-b p-4 flex items-center justify-between ${
            isBatch
              ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : isEdit
              ? 'bg-indigo-500/10 dark:bg-indigo-950/30 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              : 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2.5 font-extrabold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5" />
            <h3>{modalTitle}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Para autorizar a <span className="font-bold text-slate-900 dark:text-white">{actionText}</span> de{' '}
            <span className="font-bold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {itemDescription}
            </span>
            , digite a senha de autorização:
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="••••"
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:outline-none ${
                  isBatch || isEdit
                    ? 'border-slate-300 dark:border-slate-700 focus:ring-amber-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-rose-500'
                }`}
              />
            </div>
            {error && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                ⚠️ Senha incorreta! Digite a senha válida para continuar.
              </p>
            )}
            <p className="text-[10px] text-slate-400 italic">
              * Operação restrita a administradores. A senha é oculta (••••).
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 ${
                isBatch || isEdit
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> {confirmBtnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
