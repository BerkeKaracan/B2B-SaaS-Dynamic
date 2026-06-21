import { NextResponse } from "next/server";

interface PropInfo {
  name: string;
  type: string;
  id: string;
}

interface NotionDatabaseResponse {
  id: string;
  url?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dbTitle = String(body.dbTitle || "B2B Exported DB");
    const properties: PropInfo[] = body.properties || [];
    const rows: Record<string, string | number | boolean | null>[] =
      body.rows || [];

    const apiKey = process.env.NOTION_API_KEY;
    const pageId = process.env.NOTION_PAGE_ID;

    if (!apiKey || !pageId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing NOTION_API_KEY or NOTION_PAGE_ID in environment variables.",
        },
        { status: 400 },
      );
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    const schemaProps: Record<string, unknown> = {};
    const safeNames: Record<string, string> = {};

    properties.forEach((p, index) => {
      const safeName =
        p.name.trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ ]/g, "") ||
        `Column ${index + 1}`;
      safeNames[p.id] = safeName;

      if (index === 0) {
        schemaProps[safeName] = { title: {} };
      } else {
        if (p.type === "number")
          schemaProps[safeName] = { number: { format: "number" } };
        else if (p.type === "checkbox")
          schemaProps[safeName] = { checkbox: {} };
        else if (p.type === "date") schemaProps[safeName] = { date: {} };
        else schemaProps[safeName] = { rich_text: {} };
      }
    });

    const dbResponse = await fetch("https://api.notion.com/v1/databases", {
      method: "POST",
      headers,
      body: JSON.stringify({
        parent: { type: "page_id", page_id: pageId },
        title: [{ type: "text", text: { content: dbTitle } }],
        properties: schemaProps,
      }),
    });

    if (!dbResponse.ok) {
      const errText = await dbResponse.text();
      throw new Error(`Failed to create database: ${errText}`);
    }

    const dbData = (await dbResponse.json()) as NotionDatabaseResponse;

    for (const row of rows) {
      const pageProps: Record<string, unknown> = {};

      properties.forEach((p, index) => {
        const safeName = safeNames[p.id];
        const val = row[p.id];

        if (val === undefined || val === null || val === "") return;

        if (index === 0) {
          pageProps[safeName] = { title: [{ text: { content: String(val) } }] };
        } else {
          if (p.type === "number") {
            const num = Number(val);
            if (!isNaN(num)) pageProps[safeName] = { number: num };
          } else if (p.type === "checkbox") {
            pageProps[safeName] = { checkbox: Boolean(val) };
          } else if (p.type === "date") {
            pageProps[safeName] = { date: { start: String(val) } };
          } else {
            pageProps[safeName] = {
              rich_text: [{ text: { content: String(val) } }],
            };
          }
        }
      });

      const pageResponse = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          parent: { database_id: dbData.id },
          properties: pageProps,
        }),
      });

      if (!pageResponse.ok) {
        const errText = await pageResponse.text();
        console.error("Failed to insert row:", errText);
      }
    }

    return NextResponse.json({ success: true, url: dbData.url || null });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Notion Export Error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
