'use client';

import { Key, Webhook, Plus, Copy, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function DeveloperSettingsPage() {
  const t = useTranslations('DeveloperSettings');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <Key className="w-5 h-5" /> {t('apiKeys.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('apiKeys.description')}
            </p>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('apiKeys.newKey')}
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden bg-card text-card-foreground">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">
                  {t('apiKeys.table.name')}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t('apiKeys.table.token')}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t('apiKeys.table.createdAt')}
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  {t('apiKeys.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y border-t">
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  {t('apiKeys.productionKey')}{' '}
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs">
                    {t('apiKeys.active')}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  sk_live_...9f8a
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t('apiKeys.date1')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  {t('apiKeys.developmentKey')}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  sk_test_...2b4c
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t('apiKeys.date2')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <Webhook className="w-5 h-5" /> {t('webhooks.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('webhooks.description')}
            </p>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('webhooks.addEndpoint')}
          </button>
        </div>

        <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 border-dashed">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Webhook className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              {t('webhooks.emptyTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('webhooks.emptyDescription')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
