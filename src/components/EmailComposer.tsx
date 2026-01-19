import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendOutreachEmail } from '@/lib/api';
import type { StartupClusterMatch } from '@/lib/types';

interface EmailComposerProps {
  match: StartupClusterMatch;
  open: boolean;
  onClose: () => void;
}

function generateEmailDraft(match: StartupClusterMatch): {
  subject: string;
  body: string;
} {
  const { startup, clusters } = match;
  
  // Get matched trend names
  const trendNames = clusters
    .slice(0, 3)
    .map(c => c.clusterName)
    .join(', ');

  const subject = `Investment Inquiry - ${startup.name}`;
  
  let body = `Hi,\n\n`;
  body += `I came across ${startup.name}`;
  
  if (trendNames) {
    body += ` and was impressed by your work in ${trendNames}`;
  }
  body += `.\n\n`;
  
  if (startup.blurb) {
    body += `Your focus on "${startup.blurb.slice(0, 150)}${startup.blurb.length > 150 ? '...' : ''}" caught my attention.\n\n`;
  }
  
  if (startup.valueProp) {
    body += `Your value proposition around ${startup.valueProp.slice(0, 100)}${startup.valueProp.length > 100 ? '...' : ''} aligns well with trends we're seeing in the market.\n\n`;
  }
  
  if (startup.market) {
    body += `The market opportunity you're addressing seems promising, and I'd love to learn more about your traction and vision.\n\n`;
  } else {
    body += `I'd love to schedule a call to learn more about your vision and discuss potential investment opportunities.\n\n`;
  }
  
  body += `Looking forward to connecting.\n\n`;
  body += `Best regards,\n[Your Name]`;

  return { subject, body };
}

export function EmailComposer({ match, open, onClose }: EmailComposerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderName, setSenderName] = useState('');
  const [replyTo, setReplyTo] = useState('');

  // Generate draft when modal opens
  useEffect(() => {
    if (open && match) {
      const draft = generateEmailDraft(match);
      setSubject(draft.subject);
      setBody(draft.body);
      setTo('');
    }
  }, [open, match]);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: "Missing fields",
        description: "Please fill in the recipient, subject, and message.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOutreachEmail({
        to,
        subject,
        body,
        senderName: senderName || 'Investor',
        replyTo,
        startupName: match.startup.name,
      });

      if (result.success) {
        toast({
          title: "Email sent!",
          description: `Your message to ${match.startup.name} has been sent.`,
        });
        onClose();
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Email send error:', error);
      toast({
        title: "Failed to send",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Outreach - {match.startup.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="founder@startup.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Your Name</Label>
              <Input
                id="senderName"
                placeholder="Your name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-to Email</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="your@email.com"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
