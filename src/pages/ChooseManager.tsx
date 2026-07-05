import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronRight, X, CheckCircle, Loader2, GraduationCap, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProjectManager {
  id: string;
  name: string;
  specialization: string | null;
  is_available: boolean;
  project_count: number;
  photo_url: string | null;
  bio: string | null;
  education: string | null;
  portfolio_projects: string[];
}

const ChooseManager = () => {
  const [managers, setManagers] = useState<ProjectManager[]>([]);
  const [selectedPM, setSelectedPM] = useState<ProjectManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { void fetchManagers(); }, []);
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('is_verified, verification_type').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setIsVerified(data.is_verified); });
    }
  }, [user]);

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_project_managers');
      if (error) throw error;

      setManagers(
        ((data || []) as any[]).map((pm) => ({
          id: pm.id,
          name: pm.name,
          specialization: pm.specialization,
          is_available: pm.is_available,
          project_count: Number(pm.project_count || 0),
          photo_url: pm.photo_url,
          bio: pm.bio,
          education: pm.education,
          portfolio_projects: Array.isArray(pm.portfolio_projects) ? pm.portfolio_projects : [],
        }))
      );
    } catch (error) {
      console.error('Failed to load project managers:', error);
      toast({ title: 'Could not load project managers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPM = (pm: ProjectManager) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to select a project manager', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    if (!isVerified) {
      toast({ title: 'Premium Required', description: 'You need a verification plan to select a project manager. Get verified first!', variant: 'destructive' });
      navigate('/verification-plans');
      return;
    }
    navigate(`/dashboard?pm=${pm.id}&pm_name=${encodeURIComponent(pm.name)}`);
  };

  return (
    <MainLayout>
      <div className="relative min-h-[calc(100vh-4rem)] py-12 sm:py-20 overflow-hidden">
        {/* Premium ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-10 left-1/4 w-[420px] h-[420px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 w-[380px] h-[380px] bg-accent/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        </div>
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 border-primary/30 text-primary inline-flex items-center gap-1.5">
              <Crown className="w-3 h-3" /> Premium PM Selection
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              Choose Your <span className="gradient-text">Project Manager</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Tap a manager to open their full profile — portfolio highlights, education, and current availability.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div
                className="relative overflow-hidden mb-12"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => !selectedPM && setIsPaused(false)}
              >
                <motion.div
                  className="flex gap-6"
                  animate={isPaused ? {} : { x: [0, -(managers.length * 320)] }}
                  transition={isPaused ? {} : { duration: Math.max(managers.length, 1) * 6, repeat: Infinity, ease: 'linear' }}
                >
                  {[...managers, ...managers, ...managers].map((pm, i) => (
                    <motion.div
                      key={`${pm.id}-${i}`}
                      className="flex-shrink-0 w-[280px] cursor-pointer"
                      whileHover={{ scale: 1.04 }}
                      onClick={() => { setSelectedPM(pm); setIsPaused(true); }}
                    >
                      <Card className="glass-card hover:border-primary/50 transition-all h-full">
                        <CardContent className="p-6 text-center">
                          {pm.photo_url ? (
                            <img src={pm.photo_url} alt={`${pm.name} profile`} className="w-20 h-20 rounded-full object-cover ring-2 ring-border mx-auto mb-4" />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                              <span className="text-2xl font-bold text-primary-foreground">{pm.name.charAt(0)}</span>
                            </div>
                          )}
                          <h3 className="font-bold text-lg mb-1">{pm.name}</h3>
                          {pm.specialization && <p className="text-sm text-primary mb-2">{pm.specialization}</p>}
                          <div className="flex justify-center gap-2">
                            <Badge variant={pm.is_available ? 'default' : 'secondary'} className="text-xs">
                              {pm.is_available ? '✓ Available' : 'Busy'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{pm.project_count} projects</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <AnimatePresence>
                {selectedPM && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-3xl mx-auto"
                  >
                    <Card className="glass-card border-primary/30">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            {selectedPM.photo_url ? (
                              <img src={selectedPM.photo_url} alt={`${selectedPM.name} profile`} className="w-16 h-16 rounded-full object-cover ring-2 ring-border" />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <span className="text-xl font-bold text-primary-foreground">{selectedPM.name.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <h2 className="text-2xl font-bold">{selectedPM.name}</h2>
                              {selectedPM.specialization && <p className="text-primary">{selectedPM.specialization}</p>}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedPM(null); setIsPaused(false); }}>
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                          <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Projects Managed</p>
                              <p className="text-sm font-bold">{selectedPM.project_count}</p>
                            </div>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge variant={selectedPM.is_available ? 'default' : 'secondary'}>
                                {selectedPM.is_available ? 'Available' : 'Currently Busy'}
                              </Badge>
                            </div>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3 sm:col-span-2">
                            <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Education</p>
                              <p className="text-sm font-medium">{selectedPM.education || 'Education details will be shared during onboarding.'}</p>
                            </div>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3 sm:col-span-2">
                            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">About</p>
                              <p className="text-sm font-medium">{selectedPM.bio || 'Experienced manager focused on quality delivery and transparent communication.'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <p className="text-xs text-muted-foreground mb-2">Portfolio Highlights</p>
                          {selectedPM.portfolio_projects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedPM.portfolio_projects.map((project, index) => (
                                <Badge key={`${project}-${index}`} variant="outline">{project}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Portfolio highlights will be shared after project kickoff.</p>
                          )}
                        </div>

                        <Button className="w-full" size="lg" onClick={() => handleSelectPM(selectedPM)}>
                          {isVerified ? (
                            <><ChevronRight className="w-5 h-5 mr-2" />Select & Create Project Request</>
                          ) : (
                            <><Crown className="w-5 h-5 mr-2" />Get Verified to Select PM</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedPM && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {managers.map((pm) => (
                    <motion.div key={pm.id} whileHover={{ y: -4 }}>
                      <Card
                        className="glass-card hover:border-primary/40 transition-all cursor-pointer"
                        onClick={() => { setSelectedPM(pm); setIsPaused(true); }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-4">
                            {pm.photo_url ? (
                              <img src={pm.photo_url} alt={`${pm.name} profile`} className="w-14 h-14 rounded-full object-cover ring-2 ring-border flex-shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-primary-foreground">{pm.name.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold">{pm.name}</h3>
                              {pm.specialization && <p className="text-sm text-primary">{pm.specialization}</p>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant={pm.is_available ? 'default' : 'secondary'} className="text-xs">
                              {pm.is_available ? '✓ Available' : 'Busy'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{pm.project_count} projects</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChooseManager;
