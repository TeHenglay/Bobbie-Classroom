import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Spinner } from '../../components';
import { Layout } from '../../components/Layout';

interface Lecture {
  id: string;
  title: string;
  description: string;
  video_url: string;
  class_id: string;
  teacher_id: string;
  created_at: string;
  classes: {
    name: string;
  };
}

export const LecturesPage: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load lectures with class information
      const { data: lecturesData, error } = await supabase
        .from('lectures')
        .select(`
          *,
          classes:class_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading lectures:', error);
      }

      if (lecturesData) {
        setLectures(lecturesData as any);
      }
    } catch (error) {
      console.error('Error loading lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lecture Videos</h1>
          <p className="text-gray-600 mt-1">Watch lecture videos from all classes</p>
        </div>

        {/* Lectures Grid */}
        {lectures.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lectures available</h3>
            <p className="text-gray-600">
              Teachers haven't uploaded any lectures yet
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lectures.map((lecture) => (
              <div 
                key={lecture.id} 
                onClick={() => setSelectedLecture(lecture)}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:scale-[1.02] h-full">
                  {/* Video Thumbnail */}
                <div className="relative bg-gray-900 aspect-video group">
                  {lecture.video_url.includes('youtube.com') || lecture.video_url.includes('youtu.be') ? (
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(https://img.youtube.com/vi/${lecture.video_url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg)` 
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <video src={lecture.video_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {lecture.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {lecture.description}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {new Date(lecture.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedLecture && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900">{selectedLecture.title}</h2>
              <button
                onClick={() => setSelectedLecture(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Video Player */}
              <div className="bg-black rounded-lg overflow-hidden mb-4 aspect-video">
                {selectedLecture.video_url.includes('youtube.com') || selectedLecture.video_url.includes('youtu.be') ? (
                  <iframe
                    src={selectedLecture.video_url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <video src={selectedLecture.video_url} controls className="w-full h-full" autoPlay />
                )}
              </div>

              {/* Description */}
              {selectedLecture.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedLecture.description}</p>
                </div>
              )}

              {/* Upload Date */}
              <div className="text-sm text-gray-500">
                Uploaded on {new Date(selectedLecture.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
