import {
  User,
  Shield,
  UserPlus,
  Trash2,
  Edit,
  Search,
  Filter,
  Download,
  BarChart3,
  Activity,
  Users,
  Calendar,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";
import "../assets/space-theme.css";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string;
}

const AdminPage: React.FC = () => {
  const { role: _role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "",
  });

  // Новые состояния для улучшенного функционала
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
      toast.error("Не удалось загрузить список пользователей");
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (usersData: UserProfile[]) => {
    const today = new Date().toDateString();
    const newUsersToday = usersData.filter(
      (user) => new Date(user.created_at).toDateString() === today,
    ).length;

    const activeUsers = usersData.filter(
      (user) =>
        user.last_sign_in_at &&
        new Date(user.last_sign_in_at) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length;

    setStats({
      totalUsers: usersData.length,
      adminUsers: usersData.filter((u) => u.role === "admin").length,
      activeUsers,
      newUsersToday,
    });
  };

  // Загружаем список пользователей
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortBy as keyof UserProfile];
    const bValue = b[sortBy as keyof UserProfile];

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const exportUsers = () => {
    const csvContent = [
      ["Email", "Имя", "Роль", "Дата создания", "Последний вход"],
      ...sortedUsers.map((user) => [
        user.email,
        user.full_name || "",
        user.role,
        new Date(user.created_at).toLocaleDateString(),
        user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString()
          : "Никогда",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      role: user.role || "user",
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          role: editForm.role,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("Пользователь обновлен");
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Ошибка обновления пользователя:", error);
      toast.error("Не удалось обновить пользователя");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("Пользователь удален");
      loadUsers();
    } catch (error) {
      console.error("Ошибка удаления пользователя:", error);
      toast.error("Не удалось удалить пользователя");
    }
  };

  const handleCreateAdmin = async () => {
    const email = prompt("Введите email нового администратора:");
    if (!email) return;

    try {
      const { error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: "Администратор",
        },
      });

      if (error) throw error;

      // Создаем профиль с правами администратора
      const { error: profileError } = await supabase.from("profiles").insert({
        id: (await supabase.auth.admin.getUserByEmail(email)).data.user.id,
        email,
        full_name: "Администратор",
        role: "admin",
      });

      if (profileError) throw profileError;

      toast.success("Администратор создан");
      loadUsers();
    } catch (error) {
      console.error("Ошибка создания администратора:", error);
      toast.error("Не удалось создать администратора");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen space-bg-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-space-primary mx-auto"></div>
          <p className="mt-4 text-space-text">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-bg-gradient py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-fade-in">
          <h1 className="space-title text-3xl font-bold mb-2">
            🛡️ Панель администратора
          </h1>
          <p className="text-space-text-muted">
            Управление пользователями и мониторинг системы
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-space-bg-light p-1 rounded-lg border border-space-border">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300"
            >
              <Users className="w-4 h-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4" />
              Статистика
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="flex items-center gap-2 data-[state=active]:space-active data-[state=active]:text-white transition-all duration-300"
            >
              <Activity className="w-4 h-4" />
              Активность
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Статистические карточки */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="space-card space-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-space-text-muted">
                        Всего пользователей
                      </p>
                      <p className="text-2xl font-bold text-space-text">
                        {stats.totalUsers}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-space-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="space-card space-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-space-text-muted">
                        Администраторы
                      </p>
                      <p className="text-2xl font-bold text-space-text">
                        {stats.adminUsers}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-space-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="space-card space-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-space-text-muted">
                        Активные (7 дней)
                      </p>
                      <p className="text-2xl font-bold text-space-text">
                        {stats.activeUsers}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="space-card space-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-space-text-muted">
                        Новые сегодня
                      </p>
                      <p className="text-2xl font-bold text-space-text">
                        {stats.newUsersToday}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Панель управления */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between space-card p-4 space-fade-in">
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-space-text-muted w-4 h-4" />
                  <Input
                    placeholder="Поиск пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 space-input"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48 space-select bg-space-bg-light border-space-border text-space-text">
                    <SelectValue placeholder="Фильтр по роли" />
                  </SelectTrigger>
                  <SelectContent className="bg-space-bg-light border-space-border">
                    <SelectItem value="all" className="text-space-text hover:bg-space-active focus:bg-space-active">Все роли</SelectItem>
                    <SelectItem value="admin" className="text-space-text hover:bg-space-active focus:bg-space-active">Администраторы</SelectItem>
                    <SelectItem value="user" className="text-space-text hover:bg-space-active focus:bg-space-active">Пользователи</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 space-select bg-space-bg-light border-space-border text-space-text">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent className="bg-space-bg-light border-space-border">
                    <SelectItem value="created_at" className="text-space-text hover:bg-space-active focus:bg-space-active">Дата создания</SelectItem>
                    <SelectItem value="full_name" className="text-space-text hover:bg-space-active focus:bg-space-active">Имя</SelectItem>
                    <SelectItem value="email" className="text-space-text hover:bg-space-active focus:bg-space-active">Email</SelectItem>
                    <SelectItem value="last_sign_in_at" className="text-space-text hover:bg-space-active focus:bg-space-active">
                      Последний вход
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="space-button"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={exportUsers} variant="outline" className="space-button">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт CSV
                </Button>
                <Button
                  onClick={handleCreateAdmin}
                  className="space-button space-active"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Создать администратора
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {sortedUsers.map((user) => (
                <Card
                  key={user.id}
                  className="space-card hover:shadow-md transition-shadow space-fade-in"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-space-primary/20 rounded-full flex items-center justify-center border border-space-border">
                          <User className="w-5 h-5 text-space-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-space-text">
                            {user.full_name || "Без имени"}
                          </CardTitle>
                          <CardDescription className="text-space-text-muted">{user.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            user.role === "admin" ? "destructive" : "secondary"
                          }
                          className={
                            user.role === "admin"
                              ? "bg-red-500/20 text-red-300 border-red-500"
                              : "bg-space-bg-light text-space-text border-space-border"
                          }
                        >
                          {user.role === "admin"
                            ? "🛡️ Администратор"
                            : user.role === "superuser"
                            ? "⭐ Суперпользователь"
                            : "👤 Пользователь"}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="space-button"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.id !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="space-button bg-red-500/20 text-red-300 border-red-500 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm text-space-text-muted">
                      <div>
                        <span className="font-medium text-space-text">Создан:</span>{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium text-space-text">Последний вход:</span>{" "}
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : "Никогда"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {sortedUsers.length === 0 && (
                <Card className="space-card">
                  <CardContent className="p-8 text-center">
                    <Users className="w-16 h-16 text-space-text-muted mx-auto mb-4" />
                    <p className="text-space-text-muted">Пользователи не найдены</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="space-card space-fade-in">
                <CardHeader>
                  <CardTitle className="text-space-text">Распределение ролей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-space-text">Пользователи</span>
                      <Badge variant="secondary" className="bg-space-bg-light text-space-text border-space-border">
                        {stats.totalUsers - stats.adminUsers}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-space-text">Администраторы</span>
                      <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500">{stats.adminUsers}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="space-card space-fade-in">
                <CardHeader>
                  <CardTitle className="text-space-text">Активность пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-space-text">Активные (7 дней)</span>
                      <Badge variant="default" className="bg-space-primary/20 text-space-primary border-space-primary">{stats.activeUsers}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-space-text">Новые сегодня</span>
                      <Badge variant="outline" className="bg-space-bg-light text-space-text border-space-border">{stats.newUsersToday}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="space-card space-fade-in">
              <CardHeader>
                <CardTitle className="text-space-text">Последние действия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedUsers.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-space-border rounded-lg space-card hover:space-active transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-space-primary/20 rounded-full flex items-center justify-center border border-space-border">
                          <User className="w-4 h-4 text-space-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-space-text">
                            {user.full_name || "Без имени"}
                          </p>
                          <p className="text-sm text-space-text-muted">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-space-text-muted">
                          {user.last_sign_in_at
                            ? `Вход: ${new Date(user.last_sign_in_at).toLocaleDateString()}`
                            : "Никогда не входил"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Модальное окно редактирования */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <Card className="w-96 space-modal space-fade-in">
              <CardHeader className="space-modal-header">
                <CardTitle className="text-white">Редактировать пользователя</CardTitle>
                <CardDescription className="text-white/80">
                  Измените данные пользователя {selectedUser.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 bg-space-bg-card">
                <div>
                  <Label htmlFor="full_name" className="text-space-text font-semibold">Полное имя</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, full_name: e.target.value })
                    }
                    className="space-input mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-space-text font-semibold">Роль</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, role: value })
                    }
                  >
                    <SelectTrigger className="space-select bg-space-bg-light border-space-border text-space-text mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-space-bg-light border-space-border">
                      <SelectItem value="user" className="text-space-text hover:bg-space-active focus:bg-space-active">👤 Пользователь</SelectItem>
                      <SelectItem value="admin" className="text-space-text hover:bg-space-active focus:bg-space-active">🛡️ Администратор</SelectItem>
                      <SelectItem value="superuser" className="text-space-text hover:bg-space-active focus:bg-space-active">⭐ Суперпользователь</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleSaveUser} className="flex-1 space-button space-active">
                    💾 Сохранить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 space-button"
                  >
                    ❌ Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
