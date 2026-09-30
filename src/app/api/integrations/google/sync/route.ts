import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GOOGLE_TOKEN_URL =
  'https://oauth2.googleapis.com/token';

const GOOGLE_DRIVE_API =
  'https://www.googleapis.com/drive/v3';

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET;

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST() {
  try {
    // ---------------------------------------------------------
    // ENVIRONMENT CHECK
    // ---------------------------------------------------------

    if (
      !process.env.OPENAI_API_KEY ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            'Required server configuration is missing.',
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // AUTHENTICATE MNEMO USER
    // ---------------------------------------------------------

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                }
              );
            } catch {
              // Ignore cookie writes in this server context.
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: 'Not authenticated.',
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // ADMIN CLIENT
    // ---------------------------------------------------------

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ---------------------------------------------------------
    // FIND USER WORKSPACE
    // ---------------------------------------------------------

    const {
      data: membership,
      error: membershipError,
    } = await admin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          error: 'Workspace not found.',
        },
        { status: 404 }
      );
    }

    const workspaceId =
      membership.workspace_id;

    // ---------------------------------------------------------
    // LOAD GOOGLE CONNECTION
    // ---------------------------------------------------------

    const {
      data: connection,
      error: connectionError,
    } = await admin
      .from('google_connections')
      .select(
        'google_email, access_token, refresh_token, token_expires_at'
      )
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (connectionError) {
      console.error(
        'Google connection lookup failed:',
        connectionError
      );

      return NextResponse.json(
        {
          error:
            'Could not load Google connection.',
        },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          error:
            'Google Drive is not connected.',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // REFRESH GOOGLE ACCESS TOKEN IF NECESSARY
    // ---------------------------------------------------------

    let accessToken =
      connection.access_token;

    const tokenExpiresAt =
      connection.token_expires_at
        ? new Date(
            connection.token_expires_at
          ).getTime()
        : 0;

    const tokenNeedsRefresh =
      !accessToken ||
      tokenExpiresAt <
        Date.now() + 60_000;

    if (
      tokenNeedsRefresh &&
      connection.refresh_token
    ) {
      const tokenResponse =
        await fetch(
          GOOGLE_TOKEN_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id:
                GOOGLE_CLIENT_ID,
              client_secret:
                GOOGLE_CLIENT_SECRET,
              refresh_token:
                connection.refresh_token,
              grant_type:
                'refresh_token',
            }),
          }
        );

      const tokenData =
        await tokenResponse.json();

      if (
        !tokenResponse.ok ||
        !tokenData.access_token
      ) {
        console.error(
          'Google token refresh failed:',
          tokenData
        );

        return NextResponse.json(
          {
            error:
              'Google authorization has expired. Please reconnect Google Drive.',
          },
          { status: 401 }
        );
      }

      accessToken =
        tokenData.access_token;

      const expiresIn =
        Number(
          tokenData.expires_in || 3600
        );

      await admin
        .from('google_connections')
        .update({
          access_token:
            accessToken,
          token_expires_at:
            new Date(
              Date.now() +
                expiresIn * 1000
            ).toISOString(),
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'workspace_id',
          workspaceId
        );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            'No valid Google access token is available.',
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // LIST GOOGLE DRIVE FILES
    // ---------------------------------------------------------

    const fields = [
      'files(id,name,mimeType,size,modifiedTime,webViewLink)',
      'nextPageToken',
    ].join(',');

    const driveUrl =
      `${GOOGLE_DRIVE_API}/files?` +
      new URLSearchParams({
        pageSize: '100',
        orderBy:
          'modifiedTime desc',
        q:
          "trashed = false and (" +
          "mimeType = 'application/pdf' or " +
          "mimeType = 'text/plain' or " +
          "mimeType = 'text/csv' or " +
          "mimeType = 'text/markdown' or " +
          "mimeType = 'application/vnd.google-apps.document'" +
          ")",
        fields,
      }).toString();

    const driveResponse =
      await fetch(driveUrl, {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      });

    const driveData =
      await driveResponse.json();

    if (!driveResponse.ok) {
      console.error(
        'Google Drive list failed:',
        driveData
      );

      return NextResponse.json(
        {
          error:
            'Could not read files from Google Drive.',
        },
        { status: 502 }
      );
    }

    const files =
      driveData.files || [];

    // ---------------------------------------------------------
    // IMPORT FILES
    // ---------------------------------------------------------

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    const results: Array<{
      name: string;
      status: string;
    }> = [];

    for (const driveFile of files) {
      try {
        const externalId =
          String(driveFile.id);

        // -----------------------------------------------
        // CHECK FOR EXISTING DOCUMENT
        // -----------------------------------------------

        const {
          data: existing,
        } = await admin
          .from('documents')
          .select(
            'id,title,updated_at'
          )
          .eq(
            'workspace_id',
            workspaceId
          )
          .eq(
            'external_id',
            externalId
          )
          .maybeSingle();

        if (existing) {
          skipped++;

          results.push({
            name:
              driveFile.name,
            status:
              'already imported',
          });

          continue;
        }

        // -----------------------------------------------
        // CHECK FILE SIZE
        // -----------------------------------------------

        if (
          driveFile.size &&
          Number(driveFile.size) >
            MAX_FILE_SIZE
        ) {
          skipped++;

          results.push({
            name:
              driveFile.name,
            status:
              'skipped: file too large',
          });

          continue;
        }

        // -----------------------------------------------
        // DETERMINE CONTENT
        // -----------------------------------------------

        let content = '';
        let extension =
          getExtension(
            driveFile.name
          );

        if (
          driveFile.mimeType ===
          'application/vnd.google-apps.document'
        ) {
          // ---------------------------------------------
          // GOOGLE DOC
          // ---------------------------------------------

          const exportResponse =
            await fetch(
              `${GOOGLE_DRIVE_API}/${externalId}/export?mimeType=text/plain`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            );

          if (!exportResponse.ok) {
            throw new Error(
              `Could not export Google Doc (${exportResponse.status}).`
            );
          }

          content =
            (
              await exportResponse.text()
            ).trim();

          extension = 'txt';
        } else {
          // ---------------------------------------------
          // NORMAL DRIVE FILE
          // ---------------------------------------------

          const downloadResponse =
            await fetch(
              `${GOOGLE_DRIVE_API}/${externalId}?alt=media`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            );

          if (!downloadResponse.ok) {
            throw new Error(
              `Could not download file (${downloadResponse.status}).`
            );
          }

          const buffer =
            Buffer.from(
              await downloadResponse.arrayBuffer()
            );

          if (
            buffer.length >
            MAX_FILE_SIZE
          ) {
            skipped++;

            results.push({
              name:
                driveFile.name,
              status:
                'skipped: file too large',
            });

            continue;
          }

          if (
            driveFile.mimeType ===
            'application/pdf'
          ) {
            const {
              PDFParse,
            } = await import(
              'pdf-parse'
            );

            const parser =
              new PDFParse({
                data: buffer,
              });

            const parsed =
              await parser.getText();

            content =
              parsed.text.trim();

            await parser.destroy();

            extension = 'pdf';
          } else {
            content =
              buffer
                .toString(
                  'utf-8'
                )
                .trim();
          }
        }

        if (!content) {
          skipped++;

          results.push({
            name:
              driveFile.name,
            status:
              'skipped: no readable text',
          });

          continue;
        }

        // -----------------------------------------------
        // STORE ORIGINAL FILE
        // -----------------------------------------------

        let storagePath:
          | string
          | null = null;

        if (
          driveFile.mimeType !==
          'application/vnd.google-apps.document'
        ) {
          const downloadResponse =
            await fetch(
              `${GOOGLE_DRIVE_API}/${externalId}?alt=media`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            );

          if (
            downloadResponse.ok
          ) {
            const buffer =
              Buffer.from(
                await downloadResponse.arrayBuffer()
              );

            const safeFileName =
              driveFile.name.replace(
                /[^a-zA-Z0-9._-]/g,
                '-'
              );

            storagePath =
              `${workspaceId}/google-${crypto.randomUUID()}-${safeFileName}`;

            const {
              error:
                storageError,
            } = await admin.storage
              .from(
                'workspace-documents'
              )
              .upload(
                storagePath,
                buffer,
                {
                  contentType:
                    driveFile.mimeType ||
                    'application/octet-stream',
                  upsert: false,
                }
              );

            if (storageError) {
              console.error(
                'Google file storage error:',
                storageError
              );

              storagePath =
                null;
            }
          }
        }

        // -----------------------------------------------
        // CREATE DOCUMENT
        // -----------------------------------------------

        const {
          data: document,
          error:
            documentError,
        } = await admin
          .from('documents')
          .insert({
            workspace_id:
              workspaceId,
            title:
              driveFile.name,
            category:
              'Google Drive',
            source_type:
              'google_drive',
            file_path:
              storagePath,
            external_id:
              externalId,
            status:
              'processing',
          })
          .select()
          .single();

        if (
          documentError ||
          !document
        ) {
          throw new Error(
            documentError?.message ||
              'Could not create document.'
          );
        }

        // -----------------------------------------------
        // CHUNK DOCUMENT
        // -----------------------------------------------

        const chunks =
          chunkText(
            content,
            1200
          );

        if (!chunks.length) {
          throw new Error(
            'Document could not be divided into chunks.'
          );
        }

        // -----------------------------------------------
        // DOCUMENT EMBEDDING
        // -----------------------------------------------

        const documentEmbeddingResponse =
          await openai.embeddings.create(
            {
              model:
                'text-embedding-3-small',
              input:
                content,
            }
          );

        const documentEmbedding =
          documentEmbeddingResponse
            .data[0]?.embedding;

        if (!documentEmbedding) {
          throw new Error(
            'No document embedding was returned.'
          );
        }

        // -----------------------------------------------
        // MEMORY
        // -----------------------------------------------

        const {
          data: memory,
          error:
            memoryError,
        } = await admin
          .from('memories')
          .insert({
            workspace_id:
              String(
                workspaceId
              ),
            document_id:
              document.id,
            title:
              driveFile.name,
            content,
            source_type:
              'google_drive',
            category:
              'Google Drive',
            embedding:
              documentEmbedding,
          })
          .select(
            'id,title'
          )
          .single();

        if (
          memoryError ||
          !memory
        ) {
          throw new Error(
            memoryError?.message ||
              'Could not create Memory Library entry.'
          );
        }

        // -----------------------------------------------
        // CHUNK EMBEDDINGS
        // -----------------------------------------------

        for (
          let index = 0;
          index < chunks.length;
          index++
        ) {
          const chunk =
            chunks[index];

          const embeddingResponse =
            await openai.embeddings.create(
              {
                model:
                  'text-embedding-3-small',
                input:
                  chunk,
              }
            );

          const embedding =
            embeddingResponse
              .data[0]?.embedding;

          if (!embedding) {
            throw new Error(
              `No embedding returned for chunk ${index + 1}.`
            );
          }

          const {
            error:
              chunkError,
          } = await admin
            .from(
              'document_chunks'
            )
            .insert({
              document_id:
                document.id,
              workspace_id:
                workspaceId,
              content:
                chunk,
              chunk_index:
                index,
              embedding,
            });

          if (chunkError) {
            throw new Error(
              `Could not save chunk ${index + 1}: ${chunkError.message}`
            );
          }
        }

        // -----------------------------------------------
        // MARK READY
        // -----------------------------------------------

        const {
          error:
            updateError,
        } = await admin
          .from('documents')
          .update({
            status:
              'indexed',
          })
          .eq(
            'id',
            document.id
          )
          .eq(
            'workspace_id',
            workspaceId
          );

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        imported++;

        results.push({
          name:
            driveFile.name,
          status:
            'imported',
        });
      } catch (fileError: any) {
        console.error(
          'Google Drive file import failed:',
          fileError
        );

        failed++;

        results.push({
          name:
            driveFile.name,
          status:
            `failed: ${
              fileError?.message ||
              'unknown error'
            }`,
        });
      }
    }

    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      googleEmail:
        connection.google_email,
      found:
        files.length,
      imported,
      skipped,
      failed,
      results,
    });
  } catch (error: any) {
    console.error(
      'GOOGLE DRIVE SYNC ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Google Drive sync failed.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function getExtension(
  filename: string
): string {
  return (
    filename
      .split('.')
      .pop()
      ?.toLowerCase() || ''
  );
}

function chunkText(
  text: string,
  maxChunkLength = 1200
): string[] {
  const normalized =
    text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

  if (!normalized) {
    return [];
  }

  const paragraphs =
    normalized.split(
      /\n{2,}/
    );

  const chunks: string[] = [];

  let current = '';

  for (const paragraph of paragraphs) {
    const clean =
      paragraph.trim();

    if (!clean) continue;

    const combined =
      current
        ? `${current}\n\n${clean}`
        : clean;

    if (
      combined.length <=
      maxChunkLength
    ) {
      current = combined;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (
      clean.length <=
      maxChunkLength
    ) {
      current = clean;
      continue;
    }

    for (
      let start = 0;
      start < clean.length;
      start += maxChunkLength
    ) {
      chunks.push(
        clean.slice(
          start,
          start +
            maxChunkLength
        )
      );
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(
    Boolean
  );
}