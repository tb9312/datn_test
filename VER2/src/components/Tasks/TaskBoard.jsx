import React from 'react';
import { Row, Col, Card, Empty,Tag } from 'antd';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

const dropAnimation = {
  ...defaultDropAnimation,
  dragSourceOpacity: 0.5,
};
const getStatusColor = (status) => {
    const colors = {
      'todo': '#d9d9d9',
      'in-progress': '#1890ff',
      'done': '#52c41a',
      'backlog': '#ff4d4f'
    };
    return colors[status] || '#d9d9d9';
  };
const SortableTask = React.memo(({ task, onEdit, onDelete, onViewDetail }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task._id,
    data: {
      type: 'task',
      task,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    marginBottom: '12px'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetail={onViewDetail}
        compact={true}
      />
    </div>
  );
});

const TaskColumn = React.memo(({ 
  id, 
  title, 
  color, 
  tasks, 
  onEditTask, 
  onDeleteTask,
  onViewDetail  
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({
    id: id,
    data: {
      type: 'column',
      column: { id, title }
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: isOver ? `2px dashed ${color}` : `2px solid ${color}20`,
    backgroundColor: isOver ? `${color}10` : '#fafafa',
    borderRadius: '8px',
    height: '100%'
  };


  return (
    <Col xs={24} sm={12} lg={6}>
      <div ref={setNodeRef} style={style}>
        <Card 
          size="small"
          title={
            <div 
              style={{ display: 'flex', alignItems: 'center', cursor: 'grab', padding: '8px 0' }}
              {...attributes}
              {...listeners}
            >
              <div 
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(id),
                  marginRight: 8,
                  flexShrink: 0
                }}
              />
              <span style={{ flex: 1, fontWeight: 600 }}>{title}</span>
              <Tag 
                color={getStatusColor(id)}
                style={{ 
                  margin: 0, 
                  borderRadius: '10px',
                  minWidth: '24px',
                  textAlign: 'center'
                }}
              >
                {tasks.length}
              </Tag>
            </div>
          }
          style={{ 
            height: '100%',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          bodyStyle={{ 
            padding: '16px 12px',
            minHeight: '500px',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
          headStyle={{
            borderBottom: `2px solid ${getStatusColor(id)}`,
            background: 'white'
          }}
        >
          <SortableContext 
            items={tasks.map(t => t._id)} 
            strategy={verticalListSortingStrategy}
          >
            <div style={{ minHeight: '100px' }}>
              {tasks.length === 0 ? (
                <div 
                  style={{ 
                    height: '120px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: isOver ? '2px dashed #d9d9d9' : 'none',
                    borderRadius: '6px',
                    backgroundColor: isOver ? '#f0f8ff' : 'transparent',
                    transition: 'all 0.3s'
                  }}
                >
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="Thả công việc vào đây"
                    imageStyle={{ height: 40 }}
                  />
                </div>
              ) : (
                tasks.map((task) => (
                  <SortableTask
                    key={task._id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onViewDetail={onViewDetail}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </Card>
      </div>
    </Col>
  );
}, (prev, next) => prev.tasks === next.tasks && prev.id === next.id && prev.title === next.title);

const TaskBoard = ({ tasks, onEditTask, onDeleteTask, onTaskMove, onViewDetail }) => 
{
  const [activeTask, setActiveTask] = React.useState(null);
  const [activeColumn, setActiveColumn] = React.useState(null);

  const columns = React.useMemo(() => [
    {
      id: 'backlog',
      title: 'Tồn Đọng',
      tasks: tasks.filter(task => task.status === 'backlog')
    },
    {
      id: 'todo',
      title: 'Chưa Bắt Đầu',
      tasks: tasks.filter(task => task.status === 'todo')
    },
    {
      id: 'in-progress',
      title: 'Đang Thực Hiện',
      tasks: tasks.filter(task => task.status === 'in-progress')
    },
    {
      id: 'done',
      title: 'Hoàn Thành',
      tasks: tasks.filter(task => task.status === 'done')
    }
  ], [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = React.useCallback((event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    
    if (task) {
      setActiveTask(task);
    }
  }, [tasks]);

  const handleDragOver = React.useCallback((event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find if over is a column
    const overColumn = columns.find(col => col.id === overId);
    if (overColumn) {
      setActiveColumn(overColumn.id);
    }
  }, [columns]);

  const handleDragEnd = React.useCallback((event) => {
    const { active, over } = event;
    
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find the active task
    const activeTask = tasks.find(task => task._id === activeId);
    if (!activeTask) return;

    let targetStatus = null;

    // Case 1: Dropping over another task
    const overTask = tasks.find(task => task._id === overId);
    if (overTask) {
      targetStatus = overTask.status;
    }
    
    // Case 2: Dropping over a column
    const overColumn = columns.find(col => col.id === overId);
    if (overColumn) {
      targetStatus = overColumn.id;
    }

    // Case 3: Dropping over empty space in a column (using activeColumn from drag over)
    if (!targetStatus && activeColumn) {
      targetStatus = activeColumn;
    }

    if (!targetStatus) return;

    // Only update if status changed
    if (activeTask.status !== targetStatus) {
      onTaskMove(activeId, targetStatus);
    }
  }, [tasks, columns, activeColumn, onTaskMove]);

  const handleDragCancel = React.useCallback(() => {
    setActiveTask(null);
    setActiveColumn(null);
  }, []);

  // Get all task IDs for SortableContext
  const allTaskIds = React.useMemo(() => columns.flatMap(col => col.tasks.map(task => task._id)), [columns]);

  return (
    <div style={{ padding: '8px 0' }}>
    
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={allTaskIds}>
          <Row gutter={[16, 16]}>
            {columns.map(column => (
              <TaskColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={getStatusColor(column.id)}
                tasks={column.tasks}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onViewDetail={onViewDetail}
              />
            ))}
          </Row>
        </SortableContext>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <div style={{
              transform: 'rotate(5deg)',
              opacity: 0.8,
              cursor: 'grabbing',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}>
              <TaskCard
                task={activeTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onViewDetail={onViewDetail}
                compact={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default TaskBoard;