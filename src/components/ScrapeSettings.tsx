import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings2, Zap, Flame, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ScraperProvider = 'firecrawl' | 'lightpanda';

interface ScrapeSettingsProps {
  provider: ScraperProvider;
  onProviderChange: (provider: ScraperProvider) => void;
}

interface ProviderStatus {
  configured: boolean;
  tested: boolean;
  working: boolean;
  lastTestTime?: number;
}

export function ScrapeSettings({ provider, onProviderChange }: ScrapeSettingsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState<ScraperProvider | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<ScraperProvider, ProviderStatus>>({
    firecrawl: { configured: true, tested: false, working: false },
    lightpanda: { configured: true, tested: false, working: false },
  });

  // Load saved provider preference
  useEffect(() => {
    const saved = localStorage.getItem('scraper_provider');
    if (saved === 'firecrawl' || saved === 'lightpanda') {
      onProviderChange(saved);
    }
  }, [onProviderChange]);

  // Save provider preference
  const handleProviderChange = (newProvider: ScraperProvider) => {
    onProviderChange(newProvider);
    localStorage.setItem('scraper_provider', newProvider);
  };

  // Test a provider
  const testProvider = async (providerToTest: ScraperProvider) => {
    setTesting(providerToTest);
    
    try {
      const testUrl = 'https://example.com';
      let response;
      
      if (providerToTest === 'firecrawl') {
        response = await supabase.functions.invoke('scrape-articles', {
          body: { articles: [{ url: testUrl, title: 'Test', excerpt: '', source: 'test', authors: [], tags: [], is_pro: false, section: null, published_date: null }] },
        });
      } else {
        response = await supabase.functions.invoke('scrape-lightpanda', {
          body: { url: testUrl },
        });
      }

      const success = !response.error && (response.data?.success || response.data?.data);
      
      setProviderStatus(prev => ({
        ...prev,
        [providerToTest]: {
          configured: true,
          tested: true,
          working: success,
          lastTestTime: Date.now(),
        },
      }));

      toast({
        title: success ? `${providerToTest} working!` : `${providerToTest} failed`,
        description: success 
          ? 'Provider is configured and responding correctly.'
          : response.error?.message || 'Provider returned an error.',
        variant: success ? 'default' : 'destructive',
      });
    } catch (err) {
      setProviderStatus(prev => ({
        ...prev,
        [providerToTest]: {
          configured: false,
          tested: true,
          working: false,
          lastTestTime: Date.now(),
        },
      }));
      
      toast({
        title: `${providerToTest} test failed`,
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  };

  const getStatusBadge = (status: ProviderStatus) => {
    if (!status.tested) {
      return <Badge variant="secondary" className="text-xs">Not tested</Badge>;
    }
    if (status.working) {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Working
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Scraping Provider</CardTitle>
                <Badge variant="outline" className="ml-2">
                  {provider === 'firecrawl' ? 'Firecrawl' : 'Lightpanda'}
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <RadioGroup value={provider} onValueChange={(v) => handleProviderChange(v as ScraperProvider)}>
              <div className="space-y-3">
                {/* Firecrawl Option */}
                <div className={`flex items-start space-x-3 p-3 rounded-lg border ${provider === 'firecrawl' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="firecrawl" id="firecrawl" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="firecrawl" className="font-medium cursor-pointer flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Firecrawl
                      </Label>
                      {getStatusBadge(providerStatus.firecrawl)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cloud-based scraping with anti-bot bypass, structured data extraction, and markdown output.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">API-based</Badge>
                      <Badge variant="secondary" className="text-xs">Fast</Badge>
                      <Badge variant="secondary" className="text-xs">Reliable</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        testProvider('firecrawl');
                      }}
                      disabled={testing !== null}
                    >
                      {testing === 'firecrawl' ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Testing...</>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Lightpanda Option */}
                <div className={`flex items-start space-x-3 p-3 rounded-lg border ${provider === 'lightpanda' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="lightpanda" id="lightpanda" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="lightpanda" className="font-medium cursor-pointer flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Lightpanda
                      </Label>
                      {getStatusBadge(providerStatus.lightpanda)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Headless Chromium-based scraping with full JavaScript rendering. Better for JS-heavy sites.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">Chromium</Badge>
                      <Badge variant="secondary" className="text-xs">Full JS</Badge>
                      <Badge variant="secondary" className="text-xs">WebSocket</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        testProvider('lightpanda');
                      }}
                      disabled={testing !== null}
                    >
                      {testing === 'lightpanda' ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Testing...</>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </RadioGroup>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <strong>Tip:</strong> Use Firecrawl for most sites. Switch to Lightpanda for sites with heavy JavaScript rendering or anti-bot protection.
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
