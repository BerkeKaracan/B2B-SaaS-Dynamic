import * as React from "react";
import {
  Html,
  Body,
  Head,
  Heading,
  Hr,
  Container,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TaskAssignmentEmailProps {
  taskTitle: string;
  assigneeName: string;
  assignedBy: string;
}

export const TaskAssignmentEmail = ({
  taskTitle,
  assigneeName,
  assignedBy,
}: TaskAssignmentEmailProps) => (
  <Html>
    <Head />
    <Preview>A new task attended to you: {taskTitle}</Preview>
    <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "sans-serif" }}>
      <Container
        style={{
          backgroundColor: "#ffffff",
          margin: "0 auto",
          padding: "20px 0 48px",
          marginBottom: "64px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        }}
      >
        <Section style={{ padding: "0 48px" }}>
          <Heading
            style={{
              fontSize: "24px",
              letterSpacing: "-0.5px",
              lineHeight: "1.3",
              fontWeight: "800",
              color: "#18181b",
              padding: "17px 0 0",
            }}
          >
            Merhaba {assigneeName},
          </Heading>
          <Text
            style={{
              margin: "0 0 15px",
              fontSize: "15px",
              lineHeight: "1.4",
              color: "#3f3f46",
            }}
          >
            <b>{assignedBy}</b> assigned a new task to you.
          </Text>
          <Hr style={{ borderColor: "#e4e4e7", margin: "20px 0" }} />
          <Text
            style={{
              margin: "0",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "#a1a1aa",
            }}
          >
            Title of Task
          </Text>
          <Text
            style={{
              margin: "5px 0 15px",
              fontSize: "16px",
              lineHeight: "1.4",
              color: "#18181b",
              fontWeight: "500",
            }}
          >
            {taskTitle}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default TaskAssignmentEmail;
