import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Target, 
  Star, 
  Crown, 
  Medal,
  Award,
  Users,
  TrendingUp,
  Calendar,
  Zap
} from "lucide-react";

export default function Quest() {
  // Fetch leaderboard data
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["/api/quest/leaderboard"],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-yellow-600";
      case 2:
        return "from-gray-300 to-gray-500";
      case 3:
        return "from-orange-400 to-orange-600";
      default:
        return "from-blue-400 to-blue-600";
    }
  };

  const achievements = [
    {
      id: "first_login",
      title: "Welcome Aboard!",
      description: "Completed first login to the system",
      icon: "🎉",
      xp: 50,
      unlocked: true
    },
    {
      id: "first_student",
      title: "Teacher's Beginning",
      description: "Added your first student",
      icon: "👨‍🎓",
      xp: 100,
      unlocked: true
    },
    {
      id: "sms_sender",
      title: "Communication Master",
      description: "Send 100 SMS messages",
      icon: "📱",
      xp: 200,
      unlocked: false,
      progress: 0
    },
    {
      id: "exam_creator",
      title: "Quiz Master",
      description: "Create 10 different exams",
      icon: "📝",
      xp: 300,
      unlocked: false,
      progress: 0
    },
    {
      id: "ai_user",
      title: "AI Enthusiast",
      description: "Generate 50 questions using AI",
      icon: "🤖",
      xp: 250,
      unlocked: false,
      progress: 0
    },
    {
      id: "student_helper",
      title: "Helping Hand",
      description: "Help 20 students with AI doubt solving",
      icon: "💡",
      xp: 400,
      unlocked: false,
      progress: 0
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Trophy className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          Quest & Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Track student progress, leaderboards, and unlock achievements
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Student Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Student Leaderboard
              </CardTitle>
              <CardDescription>
                Top performing students ranked by XP and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.slice(0, 10).map((student: any, index: number) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        student.rank <= 3 ? "bg-gradient-to-r " + getRankColor(student.rank) + " text-white" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      data-testid={`leaderboard-student-${student.studentId}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(student.rank)}
                          <span className="text-lg font-bold">#{student.rank}</span>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className={`text-sm ${student.rank <= 3 ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                            {student.studentId}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-bold text-lg">{student.totalXP} XP</p>
                            <p className={`text-sm ${student.rank <= 3 ? "text-white/80" : "text-gray-500"}`}>
                              {student.streakDays} day streak
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{student.completedExams}</p>
                            <p className={`text-xs ${student.rank <= 3 ? "text-white/80" : "text-gray-500"}`}>
                              Exams
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Students Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Add students to your coaching center to see the leaderboard.
                  </p>
                  <Button asChild>
                    <a href="/teacher/students">
                      Add Students
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Students:</span>
                  <span className="font-semibold">{leaderboard.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active This Week:</span>
                  <span className="font-semibold">{Math.min(leaderboard.length, 3)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Top Scorer:</span>
                  <span className="font-semibold">
                    {leaderboard[0]?.name.split(' ')[0] || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Score:</span>
                  <span className="font-semibold">85%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Achievements
              </CardTitle>
              <CardDescription>
                Unlock achievements as you use the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${
                      achievement.unlocked 
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" 
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    }`}
                    data-testid={`achievement-${achievement.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{achievement.title}</h4>
                          <Badge 
                            variant={achievement.unlocked ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {achievement.xp} XP
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {achievement.description}
                        </p>
                        {!achievement.unlocked && achievement.progress !== undefined && (
                          <div className="space-y-1">
                            <Progress value={achievement.progress} className="h-1" />
                            <p className="text-xs text-gray-500">
                              {achievement.progress}% complete
                            </p>
                          </div>
                        )}
                        {achievement.unlocked && (
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Unlocked!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Challenge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Challenge
              </CardTitle>
              <CardDescription>
                January 2025 Challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold mb-2">Engagement Booster</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Send 500 SMS messages to students this month
                </p>
                <Progress value={0} className="mb-2" />
                <p className="text-xs text-gray-500">0 / 500 SMS sent</p>
                <Badge variant="outline" className="mt-3">
                  Reward: 1000 XP + Special Badge
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
