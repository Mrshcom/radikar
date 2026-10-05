import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import JSZip from "jszip";
import { registerKnowledgeImportRoute } from "../src/modules/imports/knowledge-import";

function body(name: string, content: string, contentType = "text/plain") {
  const boundary = "----radikar-test";
  return {
    boundary,
    payload: `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${contentType}\r\n\r\n${content}\r\n--${boundary}--\r\n`,
  };
}

function binaryBody(name: string, content: Buffer, contentType: string) {
  const boundary = "----radikar-binary";
  return {
    boundary,
    payload: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${contentType}\r\n\r\n`,
      ),
      content,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
}

function pdf(text: string, pages = 1) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${Array.from({ length: pages }, (_, index) => `${4 + index * 2} 0 R`).join(" ")}] /Count ${pages} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  for (let index = 0; index < pages; index += 1)
    objects.push(
      `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 3 0 R >> >> /MediaBox [0 0 612 792] /Contents ${5 + index * 2} 0 R >>`,
      `<< /Length ${text.length + 32} >>\nstream\nBT /F1 12 Tf 72 720 Td (${text}) Tj ET\nendstream`,
    );
  let source = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(source));
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(source);
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(source);
}

async function docx(text: string) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

async function app(max = 1024 * 1024, billing?: { recordModelUsage: (...input: unknown[]) => Promise<void> }) {
  const instance = Fastify({ logger: false });
  await instance.register(multipart);
  if (billing) {
    instance.decorateRequest("auth", null);
    instance.addHook("preHandler", async (request) => {
      (request as any).auth = { user: { id: "11111111-1111-4111-8111-111111111111" } };
    });
  }
  registerKnowledgeImportRoute(instance, billing as any, max);
  return instance;
}

function gapGptEnvironment() {
  process.env.LLM_PROVIDER = "gapgpt";
  process.env.GAPGPT_API_KEY = "test";
  process.env.GAPGPT_BASE_URL = "http://gapgpt.test/v1";
}

test("knowledge import accepts real multipart TXT and normalizes the model payload", async () => {
  const previous = {
    provider: process.env.LLM_PROVIDER,
    key: process.env.LLM_API_KEY,
    base: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
  };
  const originalFetch = globalThis.fetch;
  process.env.LLM_PROVIDER = "openai-compatible";
  process.env.LLM_API_KEY = "test";
  process.env.LLM_BASE_URL = "http://llm.test/v1";
  process.env.LLM_MODEL = "test";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                resumeData: { fullName: "سارا احمدی", summary: "توسعه‌دهنده محصول" },
                skills: ["React", "TypeScript"],
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );
  try {
    const instance = await app();
    const upload = body(
      "resume.txt",
      "سارا احمدی توسعه‌دهنده فرانت‌اند با تجربه React و TypeScript و طراحی رابط کاربری و همکاری با تیم محصول است.",
    );
    const response = await instance.inject({
      method: "POST",
      url: "/api/knowledge/import",
      headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
      payload: upload.payload,
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().resumeData.fullName, "سارا احمدی");
    assert.equal(response.json().skills, "React, TypeScript");
    await instance.close();
  } finally {
    globalThis.fetch = originalFetch;
    process.env.LLM_PROVIDER = previous.provider;
    process.env.LLM_API_KEY = previous.key;
    process.env.LLM_BASE_URL = previous.base;
    process.env.LLM_MODEL = previous.model;
  }
});

test("knowledge import rejects fake MIME, unsupported files, corrupted documents and oversized uploads", async () => {
  const instance = await app(32);
  let upload = body("resume.exe", "this is not a resume", "text/plain");
  assert.equal(
    (
      await instance.inject({
        method: "POST",
        url: "/api/knowledge/import",
        headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
        payload: upload.payload,
      })
    ).statusCode,
    415,
  );
  upload = body("resume.pdf", "corrupt pdf bytes", "text/plain");
  assert.equal(
    (
      await instance.inject({
        method: "POST",
        url: "/api/knowledge/import",
        headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
        payload: upload.payload,
      })
    ).statusCode,
    502,
  );
  upload = body("resume.docx", "corrupt document bytes", "application/pdf");
  assert.equal(
    (
      await instance.inject({
        method: "POST",
        url: "/api/knowledge/import",
        headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
        payload: upload.payload,
      })
    ).statusCode,
    502,
  );
  upload = body("resume.txt", "x".repeat(100), "application/pdf");
  assert.equal(
    (
      await instance.inject({
        method: "POST",
        url: "/api/knowledge/import",
        headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
        payload: upload.payload,
      })
    ).statusCode,
    502,
  );
  await instance.close();
});

test("knowledge import accepts valid PDF and DOCX through multipart using GapGPT", async () => {
  const previousFetch = globalThis.fetch;
  const previous = {
    provider: process.env.LLM_PROVIDER,
    key: process.env.GAPGPT_API_KEY,
    base: process.env.GAPGPT_BASE_URL,
  };
  gapGptEnvironment();
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                resumeData: {
                  fullName: "Sarah Ahmad",
                  summary: "Product engineer with React TypeScript platform experience and delivery ownership.",
                },
                skills: ["React", "TypeScript"],
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );
  try {
    const instance = await app();
    for (const upload of [
      binaryBody(
        "resume.pdf",
        pdf("Sarah Ahmad Product engineer React TypeScript platform delivery experience and team collaboration."),
        "application/pdf",
      ),
      binaryBody(
        "resume.docx",
        await docx(
          "Sarah Ahmad Product engineer React TypeScript platform delivery experience and team collaboration.",
        ),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ]) {
      const result = await instance.inject({
        method: "POST",
        url: "/api/knowledge/import",
        headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
        payload: upload.payload,
      });
      assert.equal(result.statusCode, 200, result.body);
      assert.equal(result.json().resumeData.fullName, "Sarah Ahmad");
    }
    await instance.close();
  } finally {
    globalThis.fetch = previousFetch;
    process.env.LLM_PROVIDER = previous.provider;
    process.env.GAPGPT_API_KEY = previous.key;
    process.env.GAPGPT_BASE_URL = previous.base;
  }
});

test("knowledge import rejects scanned, oversized-page and incomplete-model documents with GapGPT", async () => {
  const previousFetch = globalThis.fetch;
  const previous = {
    provider: process.env.LLM_PROVIDER,
    key: process.env.GAPGPT_API_KEY,
    base: process.env.GAPGPT_BASE_URL,
  };
  gapGptEnvironment();
  try {
    const instance = await app();
    let upload: ReturnType<typeof body> | ReturnType<typeof binaryBody> = binaryBody(
      "scanned.pdf",
      pdf(""),
      "application/pdf",
    );
    assert.equal(
      (
        await instance.inject({
          method: "POST",
          url: "/api/knowledge/import",
          headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
          payload: upload.payload,
        })
      ).statusCode,
      422,
    );
    upload = binaryBody("many-pages.pdf", pdf("text", 31), "application/pdf");
    assert.equal(
      (
        await instance.inject({
          method: "POST",
          url: "/api/knowledge/import",
          headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
          payload: upload.payload,
        })
      ).statusCode,
      502,
    );
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 });
    upload = body(
      "incomplete.txt",
      "Sarah Ahmad Product engineer React TypeScript platform delivery experience and team collaboration for multiple products.",
    );
    assert.equal(
      (
        await instance.inject({
          method: "POST",
          url: "/api/knowledge/import",
          headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
          payload: upload.payload,
        })
      ).statusCode,
      502,
    );
    await instance.close();
  } finally {
    globalThis.fetch = previousFetch;
    process.env.LLM_PROVIDER = previous.provider;
    process.env.GAPGPT_API_KEY = previous.key;
    process.env.GAPGPT_BASE_URL = previous.base;
  }
});

test("knowledge import records GapGPT usage for successful and failed provider calls without refunding credits", async () => {
  const previousFetch = globalThis.fetch;
  const previous = {
    provider: process.env.LLM_PROVIDER,
    key: process.env.GAPGPT_API_KEY,
    base: process.env.GAPGPT_BASE_URL,
  };
  const usage: Array<{ successful: boolean }> = [];
  gapGptEnvironment();
  const billing = {
    recordModelUsage: async (_user: unknown, _request: unknown, _operation: unknown, event: unknown) => {
      usage.push(event as { successful: boolean });
    },
  };
  try {
    const instance = await app(1024 * 1024, billing);
    const upload = body(
      "usage.txt",
      "Sarah Ahmad Product engineer React TypeScript platform delivery experience and team collaboration for multiple products.",
    );
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ resumeData: { fullName: "Sarah Ahmad" } }) } }],
        }),
        { status: 200 },
      );
    assert.equal(
      (
        await instance.inject({
          method: "POST",
          url: "/api/knowledge/import",
          headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
          payload: upload.payload,
        })
      ).statusCode,
      200,
    );
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { message: "GapGPT unavailable" } }), { status: 503 });
    assert.equal(
      (
        await instance.inject({
          method: "POST",
          url: "/api/knowledge/import",
          headers: { "content-type": `multipart/form-data; boundary=${upload.boundary}` },
          payload: upload.payload,
        })
      ).statusCode,
      502,
    );
    assert.ok(usage.some((event) => event.successful));
    assert.ok(usage.some((event) => !event.successful));
    await instance.close();
  } finally {
    globalThis.fetch = previousFetch;
    process.env.LLM_PROVIDER = previous.provider;
    process.env.GAPGPT_API_KEY = previous.key;
    process.env.GAPGPT_BASE_URL = previous.base;
  }
});
