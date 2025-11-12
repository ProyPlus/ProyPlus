import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatResponse } from '../../core/services/chatbot.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Message {
  text: string;
  type: 'sent' | 'received';
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
})
export class ChatbotComponent implements OnInit {
  isChatOpen = false;
  shouldShowChatbot = true;
  showHelpBubble = false; // Nuevo estado para el globo de ayuda

  userMessage = '';
  messages: Message[] = [
    { text: '¡Hola! ¿En qué puedo ayudarte?', type: 'received' }
  ];

  constructor(private router: Router, private chatService: ChatbotService, private sanitizer: DomSanitizer) {
    this.router.events.subscribe(() => {
      this.shouldShowChatbot = !this.router.url.includes('/auth/login');
    });
  }

  ngOnInit(): void {
    // Mostrar el globo de ayuda después de 3 segundos
    setTimeout(() => {
      this.showHelpBubble = true;
    }, 3000);

    // Ocultar el globo de ayuda después de 15 segundos en total
    setTimeout(() => {
      this.showHelpBubble = false;
    }, 15000);
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    this.showHelpBubble = false; // Ocultar el globo permanentemente al interactuar
  }

  selectQuestion(question: string) {
    this.messages.push({ text: question, type: 'sent' });
    this.getBotResponse(question);
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    this.messages.push({ text: this.userMessage, type: 'sent' });
    this.getBotResponse(this.userMessage);
    this.userMessage = '';
  }

  toHtml(markdown?: string): SafeHtml {
    if (!markdown) {
      return this.sanitizer.bypassSecurityTrustHtml(''); // devuelve SafeHtml vacío
    }

    const html = (marked.parse ? marked.parse(markdown) : marked(markdown)) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private getBotResponse(question: string) {
    this.messages.push({ text: '...', type: 'received' });

    this.chatService.sendMessage(question).subscribe({
      next: (res: string) => {
        const botText: string = res ?? ' ';

        const idx = this.messages.findIndex(m => m.type === 'received' && m.text === '...');
        if (idx >= 0) {
          this.messages[idx] = { text: botText, type: 'received' };
        } else {
          this.messages.push({ text: botText, type: 'received' });
        }
      },
      error: (err) => {
        console.error('Chat error:', err);
        const idx = this.messages.findIndex(m => m.type === 'received' && m.text === '...');
        const errMsg = 'Error: no se recibió respuesta';
        if (idx >= 0) {
          this.messages[idx] = { text: errMsg, type: 'received' };
        } else {
          this.messages.push({ text: errMsg, type: 'received' });
        }
      }
    });
  }
}
