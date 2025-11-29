import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

const DebugClassifications = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('debug-ma000020-classifications');

      if (error) throw error;

      setData(data);
    } catch (error: any) {
      console.error('Error fetching debug data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Debug - MA000020 Classifications</CardTitle>
            <CardDescription>
              Raw data from FWC API for award MA000020 with pageSize=200
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-destructive">Error: {error}</div>
            ) : data ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <strong>Total Count:</strong> {data._meta?.total_count || data._meta?.result_count || 0} classifications
                  <br />
                  <strong>Showing:</strong> {data.results?.length || 0} items
                  {data._meta?.pages_fetched && (
                    <>
                      <br />
                      <strong>Pages Fetched:</strong> {data._meta.pages_fetched}
                    </>
                  )}
                </div>

                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classification ID</TableHead>
                        <TableHead>Parent Name</TableHead>
                        <TableHead>Classification</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.results?.map((item: any) => (
                        <TableRow key={item.classification_fixed_id}>
                          <TableCell>{item.classification_fixed_id}</TableCell>
                          <TableCell>{item.parent_classification_name || '-'}</TableCell>
                          <TableCell>{item.classification}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {item.clause_description || '-'}
                          </TableCell>
                          <TableCell>{item.classification_level}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div>No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugClassifications;
