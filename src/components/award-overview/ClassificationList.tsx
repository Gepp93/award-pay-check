import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, HelpCircle, Sparkles } from "lucide-react";

interface ClassificationListProps {
  awardId: string;
  selectedClassification: any;
  onSelect: (classification: any) => void;
}

export const ClassificationList = ({ 
  awardId, 
  selectedClassification, 
  onSelect 
}: ClassificationListProps) => {
  const [classifications, setClassifications] = useState<any[]>([]);
  const [filteredClassifications, setFilteredClassifications] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>("all");
  const [streams, setStreams] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Common job title mappings to help with search
  const jobTitleKeywords: Record<string, string[]> = {
    'foreman': ['supervisor', 'leading hand', 'team leader', 'charge hand'],
    'excavator': ['excavator', 'machinery', 'plant operator', 'equipment operator'],
    'forklift': ['forklift', 'plant operator', 'machinery', 'lift truck'],
    'director': ['director', 'manager', 'coordinator', 'head', 'principal'],
    'teacher': ['teacher', 'educator', 'early childhood', 'childcare'],
    'assistant': ['assistant', 'support', 'aide', 'helper'],
    'tradesperson': ['tradesperson', 'qualified', 'trade', 'certified'],
    'apprentice': ['apprentice', 'trainee', 'learner'],
    'labourer': ['labourer', 'general', 'unskilled', 'entry'],
    'cook': ['cook', 'chef', 'kitchen', 'food'],
  };

  useEffect(() => {
    fetchClassifications();
  }, [awardId]);

  useEffect(() => {
    // Filter classifications when stream or search term changes
    let filtered = classifications;
    
    // Filter by stream
    if (selectedStream !== "all") {
      filtered = filtered.filter(c => c.stream === selectedStream);
    }
    
    // Enhanced search with keyword matching
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      
      // Check if search term matches any keyword category
      const matchedKeywords: string[] = [];
      Object.entries(jobTitleKeywords).forEach(([key, keywords]) => {
        // If the search term matches the key OR any of the keywords
        if (key.toLowerCase().includes(search) || search.includes(key.toLowerCase())) {
          matchedKeywords.push(...keywords);
        }
        keywords.forEach(keyword => {
          if (search.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(search)) {
            matchedKeywords.push(...keywords);
          }
        });
      });

      // Remove duplicates from matched keywords
      const uniqueKeywords = [...new Set(matchedKeywords)];

      filtered = filtered.filter(c => {
        const classification = c.classification?.toLowerCase() || '';
        const parent = c.parent_classification_name?.toLowerCase() || '';
        const description = c.clause_description?.toLowerCase() || '';
        const combined = `${classification} ${parent} ${description}`;
        
        // Direct match
        if (combined.includes(search)) return true;
        
        // Keyword match - check if any matched keyword appears in the classification
        if (uniqueKeywords.length > 0 && uniqueKeywords.some(keyword => combined.includes(keyword.toLowerCase()))) {
          return true;
        }
        
        return false;
      });
    }
    
    setFilteredClassifications(filtered);
  }, [selectedStream, searchTerm, classifications]);

  const fetchClassifications = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-classifications', {
        body: { awardId }
      });

      if (error) throw error;

      if (data?.results) {
        // Process all classifications - only filter out pure rate entries
        const subRateKeywords = ['base rate', 'weekly rate', 'hourly rate', 'industry allowance', 'total weekly rate'];
        
        const processedData = data.results
          .filter((item: any) => {
            const classification = item.classification?.toLowerCase() || '';
            // Skip pure rate entries
            return !subRateKeywords.some(keyword => classification === keyword);
          })
          .map((item: any) => ({
            classification_fixed_id: item.classification_fixed_id,
            parent_classification_name: item.parent_classification_name || 'Other',
            classification: item.classification,
            clause_description: item.clause_description || '',
            stream: item.clause_description || 'Other', // Use clause_description as stream grouping
          }));

        // Remove exact duplicates
        const uniqueClassifications = processedData.reduce((acc: any[], curr: any) => {
          const key = `${curr.parent_classification_name}_${curr.classification}_${curr.clause_description}`;
          
          if (!acc.find(item => {
            const itemKey = `${item.parent_classification_name}_${item.classification}_${item.clause_description}`;
            return itemKey === key;
          })) {
            acc.push(curr);
          }
          
          return acc;
        }, []);

        setClassifications(uniqueClassifications);
        setFilteredClassifications(uniqueClassifications);
        
        // Extract unique streams for dropdown
        const uniqueStreams = Array.from(new Set(uniqueClassifications.map(c => c.stream))) as string[];
        setStreams(uniqueStreams.sort());
      }
    } catch (error) {
      console.error('Error fetching classifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get level indicator from classification name
  const getLevelBadge = (classification: any) => {
    const combined = `${classification.classification} ${classification.parent_classification_name}`.toLowerCase();
    
    if (combined.includes('level 1') || combined.includes('grade 1') || combined.includes('entry')) {
      return <Badge variant="secondary" className="text-xs">Entry Level</Badge>;
    }
    if (combined.includes('level 2') || combined.includes('grade 2')) {
      return <Badge variant="secondary" className="text-xs">Level 2</Badge>;
    }
    if (combined.includes('level 3') || combined.includes('grade 3')) {
      return <Badge variant="secondary" className="text-xs">Level 3</Badge>;
    }
    if (combined.includes('level 4') || combined.includes('grade 4')) {
      return <Badge variant="secondary" className="text-xs">Level 4</Badge>;
    }
    if (combined.includes('supervisor') || combined.includes('foreman') || combined.includes('leading')) {
      return <Badge variant="default" className="text-xs">Supervisor</Badge>;
    }
    if (combined.includes('manager') || combined.includes('director')) {
      return <Badge variant="default" className="text-xs">Management</Badge>;
    }
    if (combined.includes('tradesperson') || combined.includes('qualified')) {
      return <Badge variant="secondary" className="text-xs">Qualified</Badge>;
    }
    if (combined.includes('apprentice') || combined.includes('trainee')) {
      return <Badge variant="outline" className="text-xs">Apprentice</Badge>;
    }
    
    return null;
  };

  // Get relevant keywords to highlight
  const getKeywords = (classification: any): string[] => {
    const combined = `${classification.classification} ${classification.parent_classification_name} ${classification.clause_description}`.toLowerCase();
    const keywords: string[] = [];
    
    if (combined.includes('forklift')) keywords.push('forklift');
    if (combined.includes('excavator')) keywords.push('excavator');
    if (combined.includes('machinery') || combined.includes('plant operator')) keywords.push('machinery');
    if (combined.includes('supervisor') || combined.includes('foreman')) keywords.push('supervisor');
    if (combined.includes('director') || combined.includes('manager')) keywords.push('management');
    if (combined.includes('teacher') || combined.includes('educator')) keywords.push('educator');
    if (combined.includes('cook') || combined.includes('chef')) keywords.push('cook');
    if (combined.includes('driver')) keywords.push('driver');
    
    return keywords;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Find Your Job Classification</CardTitle>
            <CardDescription>
              Search by your job title or role to find your pay classification
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Help Alert */}
            {showHelp && (
              <Alert>
                <Sparkles className="w-4 h-4" />
                <AlertDescription className="text-sm space-y-2">
                  <p className="font-semibold">Tips for finding your role:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Try searching by your actual job title (e.g., "forklift driver", "excavator operator")</li>
                    <li>Look for keywords like "supervisor", "operator", "assistant", or "qualified"</li>
                    <li>Check the level badges - entry level, qualified, supervisor, management</li>
                    <li>Read the full description - it often contains specific duties or equipment</li>
                    <li>If unsure, check your employment contract or ask your employer</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Enhanced Search - More Prominent */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search by Job Title
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g., forklift driver, excavator operator, director, foreman..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 h-12 text-base"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Type your actual job title - we'll find matching classifications
              </p>
            </div>

            {/* Quick Find Buttons */}
            {!searchTerm && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Find</label>
                <div className="flex flex-wrap gap-2">
                  {['Foreman', 'Operator', 'Driver', 'Director', 'Teacher', 'Manager', 'Supervisor', 'Apprentice', 'Cook', 'Assistant'].map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm(term)}
                      className="text-xs"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Work Area Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Work Area</label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All areas ({classifications.length})</option>
                {streams.map((stream) => (
                  <option key={stream} value={stream}>
                    {stream} ({classifications.filter(c => c.stream === stream).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Classifications List with Enhanced Display */}
            {filteredClassifications.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {filteredClassifications.length} match{filteredClassifications.length !== 1 ? 'es' : ''} found
                  </span>
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="text-xs h-7"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {filteredClassifications.map((classification, index) => {
                    const keywords = getKeywords(classification);
                    const levelBadge = getLevelBadge(classification);
                    
                    return (
                      <Button
                        key={`${classification.classification_fixed_id}-${index}`}
                        variant={
                          selectedClassification?.classification_fixed_id === 
                          classification.classification_fixed_id 
                            ? "default" 
                            : "outline"
                        }
                        className="w-full justify-start h-auto py-4 px-5 whitespace-normal text-left hover:bg-accent"
                        onClick={() => onSelect(classification)}
                      >
                        <div className="w-full space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold leading-relaxed break-words flex-1">
                              {classification.parent_classification_name}
                              {classification.classification && 
                               classification.classification !== classification.parent_classification_name && 
                               ` – ${classification.classification}`}
                            </div>
                            {levelBadge}
                          </div>
                          
                          {classification.clause_description && (
                            <div className="text-xs opacity-80 leading-relaxed break-words">
                              {classification.clause_description}
                            </div>
                          )}
                          
                          {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {keywords.map((keyword) => (
                                <Badge key={keyword} variant="outline" className="text-xs capitalize">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : searchTerm ? (
              <Alert>
                <HelpCircle className="w-4 h-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">No matches found for "{searchTerm}"</p>
                  <p className="text-sm">Try:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Using different keywords (e.g., "operator" instead of "driver")</li>
                    <li>Clearing the search and browsing all categories</li>
                    <li>Selecting a work area filter first</li>
                    <li>Checking your employment contract for the exact classification</li>
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No classifications available for selected area
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};