import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-image-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './image-section.component.html',
  styleUrl: './image-section.component.css'
})
export class ImageSectionComponent {
  @Input() image    = '';
  @Input() alt      = '';
  @Input() title    = '';
  @Input() text     = '';
  @Input() bullets: string[] = [];
  @Input() cta      = '';
  @Input() ctaRoute = '/';
  @Input() reverse  = false;
  /** Optional floating badge shown over the image */
  @Input() badge    = '';
}
