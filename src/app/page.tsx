'use client';

import type { NextPage } from 'next';
import { useState, useEffect, useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarDays,
  ListChecks,
  PlusCircle,
  Trash2,
  Edit3,
  Settings,
  LayoutDashboard,
  Briefcase,
  HomeIcon,
  BookOpen,
  ClipboardList,
  Bike,
  CheckSquare,
  Sunrise,
  CalendarRange,
  CalendarPlusIcon, // Changed from CalendarPlus
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isBefore, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  category: string;
  completed: boolean;
  recurrence: TaskRecurrence;
  lastCompletedDate?: Date;
}

const initialCategories = ['Work', 'Personal', 'Study', 'Errands', 'Fitness', 'Other'];

const recurrenceOptions: { value: TaskRecurrence; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const categoryIcons: Record<string, React.ElementType> = {
  Work: Briefcase,
  Personal: HomeIcon,
  Study: BookOpen,
  Errands: ClipboardList,
  Fitness: Bike,
  Other: LayoutDashboard,
};

const recurrenceIcons: Record<TaskRecurrence, React.ElementType | null> = {
  daily: Sunrise,
  weekly: CalendarRange,
  monthly: CalendarPlusIcon,
  none: null,
};

const TaskWiseLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-accent">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 00-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);


const Home: NextPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [newTaskCategory, setNewTaskCategory] = useState<string>(initialCategories[0]);
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<TaskRecurrence>('none');
  
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [activeView, setActiveView] = useState<'tasks' | 'calendar'>('tasks');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTasks = localStorage.getItem('taskwise-tasks');
    let loadedTasks: Task[] = [];
    if (storedTasks) {
      try {
        loadedTasks = JSON.parse(storedTasks).map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          category: task.category || initialCategories[0],
          completed: task.completed || false,
          recurrence: task.recurrence || 'none',
          lastCompletedDate: task.lastCompletedDate ? new Date(task.lastCompletedDate) : undefined,
        }));
      } catch (error) {
        console.error("Failed to parse tasks from local storage", error);
        loadedTasks = [];
      }
    }

    const now = new Date();
    const startOfToday = startOfDay(now);
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const startOfThisMonth = startOfMonth(now);

    const processedTasks = loadedTasks.map(task => {
      let needsReset = false;
      if (task.completed && task.lastCompletedDate) {
        const lastCompletedStartOfDay = startOfDay(task.lastCompletedDate);
        const lastCompletedStartOfWeek = startOfWeek(task.lastCompletedDate, { weekStartsOn: 1 });
        const lastCompletedStartOfMonth = startOfMonth(task.lastCompletedDate);

        if (task.recurrence === 'daily' && isBefore(lastCompletedStartOfDay, startOfToday)) {
          needsReset = true;
        } else if (task.recurrence === 'weekly' && isBefore(lastCompletedStartOfWeek, startOfThisWeek)) {
          needsReset = true;
        } else if (task.recurrence === 'monthly' && isBefore(lastCompletedStartOfMonth, startOfThisMonth)) {
          needsReset = true;
        }
      }
      return needsReset ? { ...task, completed: false } : task;
    });
    setTasks(processedTasks.sort((a, b) => (a.dueDate && b.dueDate ? a.dueDate.getTime() - b.dueDate.getTime() : (a.dueDate ? -1 : (b.dueDate ? 1 : 0)))));
  }, []);


  useEffect(() => {
    if (mounted) {
      localStorage.setItem('taskwise-tasks', JSON.stringify(tasks));
    }
  }, [tasks, mounted]);

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate(undefined);
    setNewTaskCategory(initialCategories[0]);
    setNewTaskRecurrence('none');
    setEditingTask(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsFormDialogOpen(true);
  };
  
  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || '');
    setNewTaskDueDate(task.dueDate);
    setNewTaskCategory(task.category);
    setNewTaskRecurrence(task.recurrence);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Task title cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    if (editingTask) {
      setTasks(
        tasks.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                title: newTaskTitle,
                description: newTaskDescription,
                dueDate: newTaskDueDate,
                category: newTaskCategory,
                recurrence: newTaskRecurrence,
              }
            : task
        ).sort((a, b) => (a.dueDate && b.dueDate ? a.dueDate.getTime() - b.dueDate.getTime() : (a.dueDate ? -1 : (b.dueDate ? 1 : 0))))
      );
      toast({ title: 'Success', description: 'Task updated successfully.' });
    } else {
      const newTask: Task = {
        id: String(Date.now() + Math.random()),
        title: newTaskTitle,
        description: newTaskDescription,
        dueDate: newTaskDueDate,
        category: newTaskCategory,
        recurrence: newTaskRecurrence,
        completed: false,
        // lastCompletedDate is set upon completion
      };
      setTasks((prevTasks) => [...prevTasks, newTask].sort((a, b) => (a.dueDate && b.dueDate ? a.dueDate.getTime() - b.dueDate.getTime() : (a.dueDate ? -1 : (b.dueDate ? 1 : 0)))));
      toast({ title: 'Success', description: 'Task added successfully.' });
    }
    
    setIsFormDialogOpen(false);
    resetForm();
  };

  const toggleTaskCompletion = (taskId: string) => {
    let taskTitle = '';
    let isCompleted = false;
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          taskTitle = task.title;
          isCompleted = !task.completed;
          const updatedTask = { ...task, completed: isCompleted };
          if (isCompleted && task.recurrence !== 'none') {
            updatedTask.lastCompletedDate = new Date();
          }
          return updatedTask;
        }
        return task;
      })
    );
    toast({
      title: 'Task Status Updated',
      description: `Task "${taskTitle}" marked as ${isCompleted ? 'completed' : 'pending'}.`,
    });
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    toast({
      title: 'Task Deleted',
      description: 'Task has been successfully deleted.',
    });
  };
  
  const tasksForSelectedDate = useMemo(() => tasks.filter((task) => {
    if (!selectedCalendarDate || !task.dueDate) return false;
    return (
      task.dueDate.getFullYear() === selectedCalendarDate.getFullYear() &&
      task.dueDate.getMonth() === selectedCalendarDate.getMonth() &&
      task.dueDate.getDate() === selectedCalendarDate.getDate()
    );
  }), [tasks, selectedCalendarDate]);

  const dailyTasks = useMemo(() => tasks.filter(task => task.recurrence === 'daily').sort((a,b) => a.title.localeCompare(b.title)), [tasks]);
  const weeklyTasks = useMemo(() => tasks.filter(task => task.recurrence === 'weekly').sort((a,b) => a.title.localeCompare(b.title)), [tasks]);
  const monthlyTasks = useMemo(() => tasks.filter(task => task.recurrence === 'monthly').sort((a,b) => a.title.localeCompare(b.title)), [tasks]);
  const otherTasks = useMemo(() => tasks.filter(task => task.recurrence === 'none'), [tasks]);
  
  const categorizedTasks = useMemo(() => otherTasks.reduce((acc, task) => {
    const categoryKey = task.category || 'Other';
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>), [otherTasks]);

  const dueDatesForCalendar = useMemo(() => 
    tasks.filter(task => task.dueDate).map(task => task.dueDate as Date)
  , [tasks]);

  if (!mounted) {
    return ( 
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <TaskWiseLogo />
          <p className="text-xl text-foreground mt-4">Loading TaskWise...</p>
        </div>
      </div>
    );
  }

  const renderTaskList = (taskList: Task[], sectionTitle: string, icon?: React.ElementType) => {
    if (taskList.length === 0) {
      return (
        <div key={sectionTitle}>
          <h3 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
            {icon && <icon className="mr-3 h-7 w-7 text-accent" />}
            {sectionTitle}
          </h3>
          <Card className="shadow-lg border-border bg-card">
            <CardContent className="p-6 text-center">
              <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No {sectionTitle.toLowerCase()} tasks.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div key={sectionTitle}>
        <h3 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
          {icon && <icon className="mr-3 h-7 w-7 text-accent" />}
          {sectionTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {taskList.map((task) => (
            <Card key={task.id} className={`shadow-lg border-border transition-all duration-200 hover:shadow-xl ${task.completed ? 'opacity-70 bg-muted' : 'bg-card'}`}>
              <CardHeader>
                <CardTitle className={`flex items-start justify-between text-xl ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  <span className="flex-1 mr-2 break-words">{task.title}</span>
                   <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                    className="mt-1 border-primary data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                  />
                </CardTitle>
                {task.dueDate && (
                  <CardDescription className={`text-sm ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    Due: {task.dueDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </CardDescription>
                )}
                 <CardDescription className={`text-xs capitalize ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    Category: {task.category}
                  </CardDescription>
              </CardHeader>
              {task.description && (
                <CardContent>
                  <p className={`text-sm whitespace-pre-wrap break-words ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{task.description}</p>
                </CardContent>
              )}
              <CardFooter className="flex justify-end space-x-2 pt-4">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)} aria-label={`Edit task ${task.title}`} className="text-muted-foreground hover:text-accent">
                  <Edit3 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} aria-label={`Delete task ${task.title}`} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsible="icon" variant="sidebar" side="left" defaultOpen={true}>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <TaskWiseLogo />
            <h1 className="text-2xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">
              TaskWise
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('tasks')}
                isActive={activeView === 'tasks'}
                tooltip="Task List"
              >
                <ListChecks />
                <span>Task List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('calendar')}
                isActive={activeView === 'calendar'}
                tooltip="Calendar View"
              >
                <CalendarDays />
                <span>Calendar View</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={openAddDialog} tooltip="Add New Task">
                <PlusCircle />
                <span>Add Task</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings (coming soon)" disabled>
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card rounded-lg shadow-xl border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingTask ? 'Update the details of your task.' : 'Fill in the details for your new task.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Title</Label>
              <Input
                id="title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g., Finish project report"
                className="bg-background border-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Optional: Add more details"
                className="bg-background border-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-foreground">Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal bg-background border-input text-foreground hover:bg-muted"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newTaskDueDate ? newTaskDueDate.toLocaleDateString() : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={setNewTaskDueDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">Category</Label>
              <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-popover text-popover-foreground">
                  {initialCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence" className="text-foreground">Recurrence</Label>
              <Select value={newTaskRecurrence} onValueChange={(value) => setNewTaskRecurrence(value as TaskRecurrence)}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-popover text-popover-foreground">
                  {recurrenceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="text-foreground border-input hover:bg-muted">Cancel</Button>
            </DialogClose>
            <Button onClick={handleFormSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SidebarInset className="p-4 md:p-6 lg:p-8 overflow-y-auto">
         <div className="flex items-center justify-between mb-6">
          <SidebarTrigger className="md:hidden text-foreground" />
          <h2 className="text-3xl font-bold text-foreground">
            {activeView === 'tasks' ? 'My Tasks' : 'Calendar'}
          </h2>
        </div>

        {activeView === 'tasks' && (
          <div className="space-y-8">
             {tasks.length === 0 && (
                 <Card className="shadow-lg border-border bg-card">
                    <CardContent className="p-10 text-center">
                        <CheckSquare className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">All caught up!</h3>
                        <p className="text-muted-foreground">You have no tasks. Click "Add Task" to get started.</p>
                    </CardContent>
                </Card>
            )}

            {dailyTasks.length > 0 && renderTaskList(dailyTasks, "Daily Tasks", recurrenceIcons.daily)}
            {weeklyTasks.length > 0 && renderTaskList(weeklyTasks, "Weekly Tasks", recurrenceIcons.weekly)}
            {monthlyTasks.length > 0 && renderTaskList(monthlyTasks, "Monthly Tasks", recurrenceIcons.monthly)}
            
            {Object.entries(categorizedTasks).map(([category, categoryTasks]) => {
               const IconComponent = categoryIcons[category] || LayoutDashboard;
               const pendingTasksCount = categoryTasks.filter(task => !task.completed).length;
               if (categoryTasks.length === 0) return null;

               return (
                <div key={category}>
                  <h3 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                    <IconComponent className="mr-3 h-7 w-7 text-accent" />
                    {category}
                    {pendingTasksCount > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({pendingTasksCount} pending)</span>}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categoryTasks.map((task) => (
                    <Card key={task.id} className={`shadow-lg border-border transition-all duration-200 hover:shadow-xl ${task.completed ? 'opacity-70 bg-muted' : 'bg-card'}`}>
                      <CardHeader>
                        <CardTitle className={`flex items-start justify-between text-xl ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          <span className="flex-1 mr-2 break-words">{task.title}</span>
                           <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                            aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                            className="mt-1 border-primary data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                          />
                        </CardTitle>
                        {task.dueDate && (
                          <CardDescription className={`text-sm ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                            Due: {task.dueDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </CardDescription>
                        )}
                      </CardHeader>
                      {task.description && (
                        <CardContent>
                          <p className={`text-sm whitespace-pre-wrap break-words ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{task.description}</p>
                        </CardContent>
                      )}
                      <CardFooter className="flex justify-end space-x-2 pt-4">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)} aria-label={`Edit task ${task.title}`} className="text-muted-foreground hover:text-accent">
                          <Edit3 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} aria-label={`Delete task ${task.title}`} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  </div>
                </div>
              )
            })}
            {otherTasks.length === 0 && dailyTasks.length === 0 && weeklyTasks.length === 0 && monthlyTasks.length === 0 && tasks.length > 0 && (
                <Card className="shadow-lg border-border bg-card">
                    <CardContent className="p-10 text-center">
                        <CheckSquare className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No 'Other' tasks!</h3>
                        <p className="text-muted-foreground">All your non-recurring tasks are categorized or you haven't added any yet.</p>
                    </CardContent>
                </Card>
            )}
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <div className="lg:col-span-4">
              <Card className="shadow-lg border-border bg-card">
                <CardContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={setSelectedCalendarDate}
                    className="w-full [&_button]:text-base [&_button]:h-11 [&_button]:w-11"
                    modifiers={{
                      hasTask: dueDatesForCalendar,
                    }}
                    modifiersClassNames={{
                       hasTask: "border-2 border-accent rounded-md font-bold"
                    }}
                    
                  />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">
                Tasks for {selectedCalendarDate ? selectedCalendarDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'selected date'}
              </h3>
              {tasksForSelectedDate.length > 0 ? (
                tasksForSelectedDate.map((task) => {
                  const IconComponent = categoryIcons[task.category] || LayoutDashboard;
                  return (
                  <Card key={task.id} className={`shadow-md border-border transition-all duration-200 ${task.completed ? 'opacity-70 bg-muted' : 'bg-card'}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-start justify-between text-lg ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        <span className="flex-1 mr-2 break-words">{task.title}</span>
                         <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                            className="mt-1 border-primary data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                          />
                      </CardTitle>
                       <CardDescription className={`flex items-center text-sm ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          <IconComponent className="mr-2 h-4 w-4"/> {task.category}
                        </CardDescription>
                    </CardHeader>
                     {task.description && (
                        <CardContent>
                          <p className={`text-sm whitespace-pre-wrap break-words ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{task.description}</p>
                        </CardContent>
                      )}
                    <CardFooter className="flex justify-end space-x-2 pt-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)} aria-label={`Edit task ${task.title}`} className="text-muted-foreground hover:text-accent">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} aria-label={`Delete task ${task.title}`} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                  </Card>
                  );
                })
              ) : (
                <Card className="shadow-lg border-border bg-card">
                    <CardContent className="p-10 text-center">
                        <CalendarDays className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                         <h3 className="text-xl font-semibold text-foreground mb-2">No tasks here!</h3>
                        <p className="text-muted-foreground">No tasks scheduled for this day. Enjoy your free time or add a new task!</p>
                    </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </SidebarInset>
    </div>
  );
};

export default Home;
