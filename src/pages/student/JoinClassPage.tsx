import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../../components';
import { Layout } from '../../components/Layout';

export const JoinClassPage: React.FC = () => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Find class by code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (classError || !classData) {
        setError('Invalid class code');
        return;
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', classData.id)
        .eq('student_id', user?.id)
        .single();

      if (existing) {
        setError('You are already enrolled in this class');
        return;
      }

      // Join class
      const { error: joinError } = await supabase
        .from('class_members')
        .insert([
          {
            class_id: classData.id,
            student_id: user?.id,
          },
        ]);

      if (joinError) throw joinError;

      // Show success and redirect to dashboard
      navigate('/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Join a Class</h1>

        <Card>
          <p className="text-gray-600 mb-6">
            Enter the class code provided by your teacher to join a class.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Class Code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              required
              maxLength={6}
            />

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={loading}
            >
              Join Class
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};
