import React from 'react';
import { useChatbot } from '@/contexts/ChatbotContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Bot, Zap } from 'lucide-react';

interface ChatbotSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig } = useChatbot();

  const handleModelChange = (model: string) => {
    updateConfig({ model: model as 'qwen' | 'gemini' });
  };

  const handleTemperatureChange = (value: number[]) => {
    updateConfig({ temperature: value[0] });
  };

  const handleMaxTokensChange = (value: number[]) => {
    updateConfig({ maxTokens: value[0] });
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>Chatbot Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={config.model} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Gemini (Recommended)
                  </div>
                </SelectItem>
                <SelectItem value="qwen">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Qwen
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Temperature Control */}
          <div className="space-y-2">
            <Label>Creativity (Temperature)</Label>
            <div className="px-2">
              <Slider
                value={[config.temperature]}
                onValueChange={handleTemperatureChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Focused (0.0)</span>
              <span>Balanced ({config.temperature})</span>
              <span>Creative (1.0)</span>
            </div>
          </div>

          <Separator />

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label>Response Length</Label>
            <div className="px-2">
              <Slider
                value={[config.maxTokens]}
                onValueChange={handleMaxTokensChange}
                max={2000}
                min={100}
                step={100}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short (100)</span>
              <span>{config.maxTokens} tokens</span>
              <span>Long (2000)</span>
            </div>
          </div>



          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onClose} className="flex-1">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 