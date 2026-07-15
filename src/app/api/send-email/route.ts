import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import TaskAssignmentEmail from '@/emails/TaskAssignmentEmail';
import { requireApiAuth } from '@/lib/requireApiAuth';

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.error) return auth.error;

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email, taskTitle, assigneeName, assignedBy } = await request.json();

    if (!email || !taskTitle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
