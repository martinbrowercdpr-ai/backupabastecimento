import React, { useState } from 'react';
import { Mail, Send, Copy, Check, Download, X, FileSpreadsheet, Users, ShieldAlert } from 'lucide-react';
import { DailySheet } from '../types';
import { calculateSheetSummary, formatNumber } from '../utils/calculations';
import { exportSheetToExcel } from '../utils/excel';

interface EmailModalProps {
  sheet: DailySheet;
  onClose: () => void;
}

const DEFAULT_RECIPIENTS = [
  'diego.trevisan@martinbrower.com.br',
  'david.azevedo@martinbrower.com.br',
  'Jose.Junior1@martinbrower.com.br',
];

export const EmailModal: React.FC<EmailModalProps> = ({ sheet, onClose }) => {
  const [recipients, setRecipients] = useState<string[]>(DEFAULT_RECIPIENTS);
  const [newRecipient, setNewRecipient] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  const summary = calculateSheetSummary(sheet);
  const formattedDate = sheet.date.split('-').reverse().join('/');

  const subject = `Relatório de Abastecimento Frota - ${formattedDate}`;

  // Generate plain-text email body summary
  const generateEmailBody = () => {
    let text = `RELATÓRIO DE ABASTECIMENTO DE COMBUSTÍVEL - MARTIN BROWER\n`;
    text += `Data da Folha: ${formattedDate}\n\n`;

    text += `--- RESUMO DO TANQUE DE COMBUSTÍVEL ---\n`;
    text += `Abertura do Tanque: ${formatNumber(sheet.aberturaTanque, 1)} L\n`;
    text += `Fechamento do Tanque: ${formatNumber(sheet.fechamentoTanque, 1)} L\n`;
    text += `Total Diesel Abastecido: ${formatNumber(summary.totalLitrosAbastecidos, 1)} L\n`;
    text += `Diferença no Medidor: ${summary.diferencaTanque > 0 ? '+' : ''}${formatNumber(summary.diferencaTanque, 1)} L\n`;
    text += `Total de Veículos Atendidos: ${sheet.entries.length}\n\n`;

    text += `--- DETALHAMENTO DOS ABASTECIMENTOS ---\n`;
    text += `PLACA CAVALO (L) | PLACA CARRETA TK (L) | TOTAL DIESEL | HORA | FRENTISTA | MOTORISTA | HODÔMETRO | HORÍMETRO | ROTA\n`;
    text += `------------------------------------------------------------------------------------------------------------------\n`;

    sheet.entries.forEach((entry) => {
      const cLitros = entry.litrosCavalo !== undefined ? entry.litrosCavalo : (entry.litrosCarreta ? 0 : entry.litrosDiesel);
      const tkLitros = entry.litrosCarreta || 0;
      const cStr = `${entry.placa || '-'}` + (cLitros > 0 ? ` (${formatNumber(cLitros, 1)}L)` : '');
      const tkStr = entry.placaCarreta ? `${entry.placaCarreta}` + (tkLitros > 0 ? ` (${formatNumber(tkLitros, 1)}L)` : '') : '-';

      text += `${cStr} | ${tkStr} | ${formatNumber(entry.litrosDiesel, 1)}L | ${entry.hora || '--:--'} | ${entry.frentista || '-'} | ${entry.motorista || '-'} | ${entry.hodometro || 0} km | ${entry.horimetro || 0} h | ${entry.rota || '-'}\n`;
    });

    text += `\n----------------------------------------------------------------------------------\n`;
    text += `Anexo em Excel gerado automaticamente pelo Sistema de Controle de Abastecimento.\n`;

    return text;
  };

  const emailBodyText = generateEmailBody();

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim()) return;
    if (recipients.includes(newRecipient.trim())) return;
    setRecipients([...recipients, newRecipient.trim()]);
    setNewRecipient('');
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter((email) => email !== emailToRemove));
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(emailBodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = () => {
    // 1. Trigger download of Excel sheet so user has the file ready to attach
    exportSheetToExcel(sheet);

    // 2. Open mailto link
    const recipientStr = recipients.join(';');
    const mailtoUrl = `mailto:${recipientStr}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBodyText)}`;

    window.location.href = mailtoUrl;

    setEmailSentNotice(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Mail className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg uppercase text-slate-100 tracking-wide">
                Enviar Tabela Excel por E-mail
              </h2>
              <p className="text-xs text-slate-400">
                Encaminhar relatório completo do dia {formattedDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 max-h-[calc(92vh-140px)] text-xs sm:text-sm">
          
          {/* Email Sent Alert Banner */}
          {emailSentNotice && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 flex items-start gap-3 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                  Planilha Excel Baixada e Cliente de E-mail Iniciado!
                </p>
                <p className="text-xs mt-1 text-emerald-200/90 leading-relaxed">
                  O arquivo <strong>Controle_Abastecimento_{sheet.date}.xlsx</strong> foi baixado no seu computador. Seu programa de e-mail foi aberto com os destinatários e o texto preenchidos. Anexe o arquivo baixado e envie!
                </p>
              </div>
            </div>
          )}

          {/* Destinatários Martin Brower */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Destinatários Configurados ({recipients.length})</span>
            </label>

            <div className="flex flex-wrap gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              {recipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-950/80 border border-sky-500/30 text-sky-200 font-mono text-xs rounded-lg font-semibold"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="text-sky-400 hover:text-rose-400 cursor-pointer ml-1"
                    title="Remover e-mail"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}

              {recipients.length === 0 && (
                <span className="text-xs text-rose-400 italic">
                  Nenhum destinatário adicionado.
                </span>
              )}
            </div>

            {/* Add recipient input */}
            <form onSubmit={handleAddRecipient} className="flex gap-2 pt-1">
              <input
                type="email"
                placeholder="Adicionar outro e-mail..."
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer border border-slate-700"
              >
                + Adicionar
              </button>
            </form>
          </div>

          {/* Assunto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Assunto do E-mail
            </label>
            <input
              type="text"
              readOnly
              value={subject}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none"
            />
          </div>

          {/* Visualização do Corpo do E-mail */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Pré-visualização do Conteúdo do E-mail</span>
              </label>

              <button
                onClick={handleCopyText}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              rows={10}
              value={emailBodyText}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 leading-relaxed focus:outline-none resize-none"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <button
            onClick={() => exportSheetToExcel(sheet)}
            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-emerald-500/30 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Apenas Baixar Excel (.xlsx)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleSendEmail}
              disabled={recipients.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer uppercase tracking-wider transition-all"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>Enviar Planilha por E-mail</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
