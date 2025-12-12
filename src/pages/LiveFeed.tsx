import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, RefreshCw, Calendar, Globe } from "lucide-react";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type ExamType = Database["public"]["Enums"]["exam_type"] | "all";

const EXAMS: { id: ExamType; label: string }[] = [
    { id: "all", label: "All News" },
    { id: "rbi_grade_b", label: "RBI Grade B" },
    { id: "sebi_grade_a", label: "SEBI Grade A" },
    { id: "nabard_grade_a", label: "NABARD" },
    { id: "upsc_cse", label: "UPSC CSE" },
    { id: "ssc_cgl", label: "SSC CGL" },
    { id: "ibps_po", label: "Banking (PO/Clerk)" },
];

const LiveFeed = () => {
    const [selectedExam, setSelectedExam] = useState<ExamType>("all");
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);

    const fetchArticles = async (exam: ExamType) => {
        try {
            setLoading(true);
            let query = supabase
                .from('articles')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(50);

            if (exam !== 'all') {
                query = query.contains('exam_tags', [exam]);
            }

            const { data, error } = await query;

            if (error) throw error;
            setArticles(data || []);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
            setIsRefetching(false);
        }
    };

    useEffect(() => {
        fetchArticles(selectedExam);
    }, [selectedExam]);

    const handleRefresh = () => {
        setIsRefetching(true);
        fetchArticles(selectedExam);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Filter Bar */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Live News Feed
                        </h1>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            className={isRefetching ? "animate-spin" : ""}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Scrollable Pills */}
                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {EXAMS.map((exam) => (
                            <button
                                key={exam.id}
                                onClick={() => setSelectedExam(exam.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                                    ${selectedExam === exam.id
                                        ? "bg-blue-600 text-white shadow-md transform scale-105"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }
                                `}
                            >
                                {exam.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500">Curating the latest updates for you...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                        <p className="text-gray-500 text-lg">No recent news found for this category.</p>
                        <Button variant="link" onClick={() => setSelectedExam('all')}>View All News</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <Card key={article.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border-gray-100">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
                                            {article.source_name}
                                        </Badge>
                                        <span className="text-xs text-gray-400 flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {article.published_at ? format(new Date(article.published_at), 'MMM d, h:mm a') : 'Just now'}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg font-semibold leading-tight text-gray-900 line-clamp-2">
                                        {article.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow pb-4">
                                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                        {article.summary || article.content?.substring(0, 150) + "..." || "No summary available."}
                                    </p>

                                    {/* Tags */}
                                    {article.exam_tags && article.exam_tags.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-1">
                                            {article.exam_tags.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100">
                                                    {tag.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-0 border-t bg-gray-50/50 p-4">
                                    <Button asChild variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 justify-between group">
                                        <a href={article.original_url} target="_blank" rel="noopener noreferrer">
                                            Read Full Article
                                            <ExternalLink className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveFeed;
