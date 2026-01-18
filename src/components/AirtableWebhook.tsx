import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ExternalLink, Check, Loader2 } from 'lucide-react';

interface AirtableWebhookProps {
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
}

export function AirtableWebhook({ webhookUrl, onWebhookUrlChange }: AirtableWebhookProps) {
  const [localUrl, setLocalUrl] = useState(webhookUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalUrl(webhookUrl);
  }, [webhookUrl]);

  const handleSave = () => {
    onWebhookUrlChange(localUrl);
    localStorage.setItem('airtable_webhook_url', localUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="airtable-webhook" className="text-sm font-medium">
              Airtable Webhook URL
            </Label>
            <a 
              href="https://airtable.com/developers/web/guides/automations-webhooks" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Setup guide <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <Input
              id="airtable-webhook"
              type="url"
              placeholder="https://hooks.airtable.com/workflows/..."
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
              disabled={!localUrl || localUrl === webhookUrl}
            >
              {saved ? <Check className="h-4 w-4 text-green-600" /> : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your startup data will be sent to this webhook after clustering completes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export async function sendToAirtable(
  webhookUrl: string, 
  startups: Array<{
    name: string;
    website?: string;
    tags?: string;
    location?: string;
    maturity?: string;
    businessType?: string;
    blurb?: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }

  try {
    console.log(`Sending ${startups.length} startups to Airtable webhook`);
    
    // Airtable expects records in a specific format
    const payload = {
      timestamp: new Date().toISOString(),
      source: 'Startup Clustering Tool',
      total_startups: startups.length,
      startups: startups.map(s => ({
        name: s.name || '',
        website: s.website || '',
        tags: s.tags || '',
        location: s.location || '',
        stage: s.maturity || '',
        business_type: s.businessType || '',
        description: s.blurb || ''
      }))
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Airtable webhooks may not support CORS
      body: JSON.stringify(payload),
    });

    // With no-cors mode, we can't read the response, but the request is sent
    console.log('Airtable webhook request sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending to Airtable:', error);
    return { success: false, error: String(error) };
  }
}
