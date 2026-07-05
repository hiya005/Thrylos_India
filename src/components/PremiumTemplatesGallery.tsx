import { useState } from "react";
import { Crown, Lock, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  gradient: string;
}

const TEMPLATES: Template[] = [
  { id: "saas-pro", name: "SaaS Pro Launch", description: "Full SaaS landing + dashboard + auth + billing.", category: "Web App", features: ["Auth & billing", "Dashboard UI", "Marketing site", "Email flows"], gradient: "from-blue-500/20 to-purple-500/20" },
  { id: "ecom-elite", name: "E-commerce Elite", description: "Premium storefront with payments and inventory.", category: "E-commerce", features: ["Cart & checkout", "Stripe/Cashfree", "Admin panel", "Order tracking"], gradient: "from-emerald-500/20 to-teal-500/20" },
  { id: "agency-portfolio", name: "Agency Portfolio", description: "Award-style agency portfolio with case studies.", category: "Marketing", features: ["Case studies", "Animated hero", "Client logos", "Contact CRM"], gradient: "from-amber-500/20 to-orange-500/20" },
  { id: "ai-product", name: "AI Product Suite", description: "AI-powered product with chat, generation, and analytics.", category: "AI", features: ["LLM integration", "Chat UI", "Usage metering", "Admin analytics"], gradient: "from-pink-500/20 to-rose-500/20" },
  { id: "mobile-first", name: "Mobile-First PWA", description: "Installable PWA with offline support and push.", category: "Mobile", features: ["PWA install", "Offline mode", "Push notifs", "App-like UX"], gradient: "from-cyan-500/20 to-blue-500/20" },
  { id: "course-platform", name: "Course Platform Pro", description: "Sell courses with video hosting and certificates.", category: "EdTech", features: ["Video lessons", "Quizzes", "Certificates", "Student portal"], gradient: "from-violet-500/20 to-fuchsia-500/20" },
];

interface Props {
  isPremium: boolean;
  selectedTemplate: string;
  onSelect: (template: Template) => void;
}

const PremiumTemplatesGallery = ({ isPremium, selectedTemplate, onSelect }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? TEMPLATES : TEMPLATES.slice(0, 4);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">Premium Templates</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium border border-amber-500/30">Members only</span>
        </div>
        {!isPremium && (
          <Button asChild size="sm" variant="link" className="text-amber-400 h-auto p-0">
            <Link to="/verification-plans">Unlock</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((tpl) => {
          const isSelected = selectedTemplate === tpl.name;
          const locked = !isPremium;
          return (
            <button
              key={tpl.id}
              type="button"
              disabled={locked}
              onClick={() => onSelect(tpl)}
              className={`relative text-left p-4 rounded-lg border transition-all overflow-hidden bg-gradient-to-br ${tpl.gradient} ${
                isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {locked && (
                <div className="absolute top-2 right-2">
                  <div className="w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-amber-500/40">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
              )}
              {isSelected && !locked && (
                <div className="absolute top-2 right-2">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-sm">{tpl.name}</h4>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">{tpl.description}</p>
              <div className="flex flex-wrap gap-1">
                {tpl.features.slice(0, 3).map((f) => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 border border-border/50">{f}</span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">{tpl.category}</p>
            </button>
          );
        })}
      </div>

      {TEMPLATES.length > 4 && (
        <Button type="button" variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : `Show ${TEMPLATES.length - 4} more templates`}
        </Button>
      )}

      {!isPremium && (
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          🔒 Premium templates are reserved for verified members. <Link to="/verification-plans" className="text-amber-400 hover:underline">Upgrade →</Link>
        </p>
      )}
    </div>
  );
};

export default PremiumTemplatesGallery;
