import { Document, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { Transaction, User } from '@/types/expense';

export async function exportToWord(transactions: Transaction[], users: User[], userId?: number) {
  // Filter transactions by user if userId is provided
  const filteredTransactions = userId 
    ? transactions.filter(t => t.userId === userId)
    : transactions;

  if (filteredTransactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  const user = userId ? users.find(u => u.id === userId) : null;
  const userName = user ? user.name : 'All Users';
  
  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const netBalance = totalIncome - totalExpense;

  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
    return dateB.getTime() - dateA.getTime();
  });

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'Transaction Statement',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        
        // User info
        new Paragraph({
          text: `Account Holder: ${userName}`,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: `Statement Date: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`,
          spacing: { after: 400 },
        }),

        // Summary section
        new Paragraph({
          text: 'Account Summary',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Total Income', bold: true })],
                  })],
                  shading: { fill: 'E8F5E9' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: `₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    })],
                    alignment: AlignmentType.RIGHT,
                  })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Total Expenses', bold: true })],
                  })],
                  shading: { fill: 'FFEBEE' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: `₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    })],
                    alignment: AlignmentType.RIGHT,
                  })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Net Balance', bold: true })],
                  })],
                  shading: { fill: 'E3F2FD' },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: `₹${netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    })],
                    alignment: AlignmentType.RIGHT,
                  })],
                }),
              ],
            }),
          ],
        }),

        // Transaction details
        new Paragraph({
          text: 'Transaction Details',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),

        // Transactions table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Header row
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Date', bold: true })],
                  })],
                  shading: { fill: 'BBDEFB' },
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Account', bold: true })],
                  })],
                  shading: { fill: 'BBDEFB' },
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Description', bold: true })],
                  })],
                  shading: { fill: 'BBDEFB' },
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Type', bold: true })],
                  })],
                  shading: { fill: 'BBDEFB' },
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Amount (₹)', bold: true })],
                    alignment: AlignmentType.RIGHT,
                  })],
                  shading: { fill: 'BBDEFB' },
                }),
              ],
            }),
            // Transaction rows
            ...sortedTransactions.map(t => {
              const txUser = users.find(u => u.id === t.userId);
              const d = new Date(`${t.date}T${t.time || '00:00:00'}`);
              const dateString = d.toLocaleDateString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric' 
              });
              
              return new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: dateString })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: txUser?.name || 'N/A' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: t.description || '-' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ 
                        text: t.type.charAt(0).toUpperCase() + t.type.slice(1),
                        color: t.type === 'income' ? '2E7D32' : 'C62828',
                      })],
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      text: Number(t.amount).toLocaleString('en-IN', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }),
                      alignment: AlignmentType.RIGHT,
                    })],
                  }),
                ],
              });
            }),
          ],
        }),

        // Footer
        new Paragraph({
          children: [new TextRun({
            text: `\nGenerated on ${new Date().toLocaleString('en-US', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}`,
            italics: true,
          })],
          spacing: { before: 400 },
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  // Generate and save the document
  const { Packer } = await import('docx');
  const blob = await Packer.toBlob(doc);
  const userSuffix = userId ? `_${userName.replace(/\s+/g, '_')}` : '';
  saveAs(blob, `transaction_statement${userSuffix}_${new Date().toISOString().slice(0,10)}.docx`);
}
