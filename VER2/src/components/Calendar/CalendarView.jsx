import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, List, Tag, Avatar, Space } from 'antd';
import { ClockCircleOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment';

const CalendarView = ({ events, onEventClick, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [modalVisible, setModalVisible] = useState(false);
  const [dateEvents, setDateEvents] = useState([]);

  const getListData = (value) => {
    const currentDate = value.format('YYYY-MM-DD');
    return events.filter(event => 
      moment(event.start).format('YYYY-MM-DD') === currentDate ||
      moment(event.end).format('YYYY-MM-DD') === currentDate ||
      (moment(event.start).isBefore(value) && moment(event.end).isAfter(value))
    );
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    
    return (
      <div style={{ minHeight: '80px', padding: '2px' }}>
        {listData.map((event, index) => (
          <div
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              handleEventClick(event);
            }}
            style={{
              background: event.color || '#1890ff',
              color: 'white',
              fontSize: '10px',
              padding: '2px 4px',
              margin: '1px 0',
              borderRadius: '2px',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <Badge status="processing" />
            {event.title}
          </div>
        ))}
      </div>
    );
  };

  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      // Default modal
      Modal.info({
        title: event.title,
        width: 600,
        content: (
          <div>
            <p><strong>Mô tả:</strong> {event.description}</p>
            <p><strong>Thời gian:</strong> {moment(event.start).format('DD/MM/YYYY HH:mm')} - {moment(event.end).format('DD/MM/YYYY HH:mm')}</p>
            <p><strong>Loại:</strong> <Tag color={event.color}>{event.type}</Tag></p>
            {event.assignee && (
              <p>
                <strong>Người phụ trách:</strong>{' '}
                <Space>
                  <Avatar size="small" src={event.assignee.avatar} icon={<UserOutlined />} />
                  <span>{event.assignee.name}</span>
                </Space>
              </p>
            )}
            {event.participants && event.participants.length > 0 && (
              <p>
                <strong>Thành viên:</strong>{' '}
                <Avatar.Group size="small" maxCount={3}>
                  {event.participants.map((participant, idx) => (
                    <Avatar key={idx} src={participant.avatar} icon={<UserOutlined />} />
                  ))}
                </Avatar.Group>
              </p>
            )}
          </div>
        ),
      });
    }
  };

  const handleSelect = (value) => {
    setSelectedDate(value);
    setDateEvents(getListData(value));
    setModalVisible(true);
    
    if (onDateSelect) {
      onDateSelect(value);
    }
  };

  const getMonthData = (value) => {
    if (value.month() === 8) {
      return 1394;
    }
  };

  const monthCellRender = (value) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  return (
    <>
      <Calendar
        dateCellRender={dateCellRender}
        monthCellRender={monthCellRender}
        onSelect={handleSelect}
        headerRender={({ value, type, onChange, onTypeChange }) => {
          return (
            <div style={{ padding: 8, textAlign: 'center', background: '#fafafa', borderRadius: '8px 8px 0 0' }}>
              <Space>
                <button
                  onClick={() => onChange(value.clone().subtract(1, 'month'))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  ‹
                </button>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {value.format('MMMM YYYY')}
                </span>
                <button
                  onClick={() => onChange(value.clone().add(1, 'month'))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  ›
                </button>
              </Space>
            </div>
          );
        }}
      />

      <Modal
        title={`Sự kiện ngày ${selectedDate.format('DD/MM/YYYY')}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {dateEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Không có sự kiện nào trong ngày này</p>
          </div>
        ) : (
          <List
            dataSource={dateEvents}
            renderItem={(event) => (
              <List.Item
                actions={[
                  <Tag color={event.color}>{event.type}</Tag>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ backgroundColor: event.color }} 
                      icon={<ClockCircleOutlined />} 
                    />
                  }
                  title={
                    <div 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleEventClick(event)}
                    >
                      {event.title}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <div>
                        {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                      </div>
                      {event.assignee && (
                        <div>
                          <UserOutlined /> {event.assignee.name}
                        </div>
                      )}
                      {event.description && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {event.description}
                        </div>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
};

export default CalendarView;