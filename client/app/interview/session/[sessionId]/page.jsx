'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import { interviewAPI } from '@/lib/api';

const ROUND_LABELS = {
  technical: 'Technical Round',
  hr: 'HR Round',
  manager: 'Manager Round',
  cto: 'CTO Round',
  case: 'Case Study Round',
};

export default function InterviewSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const router = useRouter();
  
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0); // in seconds
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    fetchNextQuestion();
  }, [sessionId]);

  // Timer effect - update time spent every second
  useEffect(() => {
    if (!questionStartTime || evaluation) return;

    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - questionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [questionStartTime, evaluation]);

  const fetchNextQuestion = async () => {
    setLoading(true);
    setError('');
    setEvaluation(null);
    setAnswer('');
    setTimeSpent(0);
    setQuestionStartTime(Date.now());

    try {
      const response = await interviewAPI.getNextQuestion(sessionId);
      if (response.success) {
        if (response.data.allQuestionsAnswered) {
          setAllQuestionsAnswered(true);
        } else {
          setQuestion(response.data);
          if (response.data.sessionStartTime) {
            setSessionStartTime(new Date(response.data.sessionStartTime));
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch question');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Please enter an answer');
      return;
    }

    setSubmitting(true);
    setError('');

    // Calculate time spent on this question
    const finalTimeSpent = questionStartTime 
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : 0;

    try {
      const response = await interviewAPI.submitAnswer(
        sessionId,
        question.questionId,
        answer,
        finalTimeSpent
      );
      
      if (response.success) {
        setEvaluation(response.data.evaluation);
        
        // If no more questions, wait a bit then redirect to summary
        if (!response.data.nextQuestionAvailable) {
          setTimeout(() => {
            router.push(`/interview/session/${sessionId}/summary`);
          }, 3000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setEvaluation(null);
    fetchNextQuestion();
  };

  const handleCompleteEarly = async () => {
    if (!confirm('Are you sure you want to complete the interview now? You will see results for the questions you\'ve answered so far.')) {
      return;
    }

    setCompleting(true);
    try {
      const response = await interviewAPI.complete(sessionId, true);
      if (response.success) {
        router.push(`/interview/session/${sessionId}/summary`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete interview');
    } finally {
      setCompleting(false);
    }
  };

  if (allQuestionsAnswered) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">All Questions Answered!</h2>
              <p className="text-gray-600 mb-6">Redirecting to summary...</p>
              <Button onClick={() => router.push(`/interview/session/${sessionId}/summary`)}>
                View Summary
              </Button>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Interview Session</h1>

        {loading ? (
          <Card>
            <Loader size="lg" />
          </Card>
        ) : question ? (
          <>
            <Card className="mb-6">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                    {ROUND_LABELS[question.roundType] || question.roundType}
                  </span>
                  <span className="text-gray-600">
                    Question {question.questionNumber} of {question.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {question.timeMinutes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Time Limit: </span>
                      <span className="font-medium">{question.timeMinutes} min</span>
                    </div>
                  )}
                  <div className={`text-sm font-medium ${
                    question.timeMinutes && timeSpent >= question.timeMinutes * 60 
                      ? 'text-red-600' 
                      : question.timeMinutes && timeSpent >= question.timeMinutes * 60 * 0.8
                      ? 'text-yellow-600'
                      : 'text-gray-700'
                  }`}>
                    Time: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-4">{question.questionText}</h2>
              
              {question.difficulty && (
                <p className="text-sm text-gray-500 mb-4">
                  Difficulty: <span className="capitalize">{question.difficulty}</span>
                </p>
              )}
            </Card>

            {!evaluation ? (
              <Card>
                <form onSubmit={handleSubmitAnswer}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer
                    </label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Type your answer here..."
                      disabled={submitting}
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={submitting || !answer.trim()}
                      className="flex-1"
                    >
                      {submitting ? <Loader size="sm" /> : 'Submit Answer'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCompleteEarly}
                      disabled={submitting || completing}
                      className="flex-1"
                    >
                      {completing ? <Loader size="sm" /> : 'Complete Early'}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card>
                <h3 className="text-xl font-semibold mb-4">Evaluation</h3>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Score:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {evaluation.score}/10
                    </span>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-2">Feedback:</h4>
                  <p className="text-gray-700">{evaluation.feedbackText}</p>
                </div>

                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-green-700">Strengths:</h4>
                    <ul className="list-disc list-inside text-gray-700">
                      {evaluation.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-red-700">Areas for Improvement:</h4>
                    <ul className="list-disc list-inside text-gray-700">
                      {evaluation.weaknesses.map((weakness, idx) => (
                        <li key={idx}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.improvementTips && evaluation.improvementTips.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-blue-700">Improvement Tips:</h4>
                    <ul className="list-disc list-inside text-gray-700">
                      {evaluation.improvementTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button onClick={handleNext} className="flex-1">
                    Next Question
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCompleteEarly}
                    disabled={completing}
                    className="flex-1"
                  >
                    {completing ? <Loader size="sm" /> : 'Complete Early'}
                  </Button>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <p className="text-gray-600">No question available</p>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

