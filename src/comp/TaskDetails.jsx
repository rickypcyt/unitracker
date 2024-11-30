import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
  } from "@chakra-ui/react";
  
  const TaskDetails = ({ task }) => (
    <Accordion allowToggle>
      <AccordionItem>
        <AccordionButton>
          <Box flex="1" textAlign="left">{task.title}</Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Text>{task.notes}</Text>
          {task.pdf && <a href={task.pdf} target="_blank">View PDF</a>}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
  
  export default TaskDetails;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Save file to task object
    }
  };
  
  <Input type="file" onChange={handleFileUpload} />;
  