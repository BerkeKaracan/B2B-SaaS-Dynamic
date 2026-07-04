import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import TaskAssignmentEmail from '@/emails/TaskAssignmentEmail';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email, taskTitle, assigneeName, assignedBy } = await request.json();

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [email],
      subject: `[New Task] ${taskTitle}`,
      react: TaskAssignmentEmail({
        taskTitle,
        assigneeName,
        assignedBy,
      }) as React.ReactElement,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
