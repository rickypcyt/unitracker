const Achievements = () => {
    const tasks = useSelector((state) => state.tasks);
    const completed = tasks.filter((task) => task.completed).length;
  
    return (
      <Box>
        {completed >= 10 && <Text>🎉 10 Tasks Completed!</Text>}
        {completed >= 20 && <Text>🔥 20 Tasks Completed!</Text>}
      </Box>
    );
  };
  