import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout title="Careers" subtitle="Help us build the fastest delivery network in the Ottawa region." eyebrow="Join the team">
  <p class="cr-intro">VAN DIRECT is a fast-growing startup based in Ottawa, Ontario. We value autonomy, clear communication and people who take ownership. Current openings are listed below. Don't see a fit? Send a spontaneous application to <strong>TODO: careers&#64;vandirect.ca</strong>.</p>
  <div class="cr-jobs">
    <div *ngFor="let j of jobs" class="cr-job">
      <div class="cr-job-left">
        <span class="cr-dept">{{ j.dept }}</span>
        <h3 class="cr-title">{{ j.title }}</h3>
        <span class="cr-loc"><span class="material-icons" style="font-size:14px;vertical-align:middle">location_on</span> {{ j.location }}</span>
      </div>
      <div class="cr-job-right">
        <span class="cr-type">{{ j.type }}</span>
        <a routerLink="/contact" class="btn btn-outline btn-sm">Apply</a>
      </div>
    </div>
  </div>
  <p class="cr-note">⚠ These are placeholder job listings. Replace with real openings before go-live.</p>
  <div class="cr-driver-cta">
    <h2>Drive for VAN DIRECT</h2>
    <p>Flexible hours, competitive pay per delivery, weekly payout. All you need is a vehicle and a valid Canadian driver's licence.</p>
    <a routerLink="/register" class="btn btn-primary">Become a driver →</a>
  </div>
</app-page-layout>`,
  styles: [`
    .cr-intro { font-size: .95rem; color: var(--text-2); line-height: 1.8; margin-bottom: 32px; }
    .cr-jobs  { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px; }
    .cr-job   { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; border-bottom: 1px solid var(--border); background: var(--surface); flex-wrap: wrap; }
    .cr-job:last-child { border-bottom: none; }
    .cr-dept  { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--brand); display: block; margin-bottom: 4px; }
    .cr-title { font-size: .95rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
    .cr-loc   { font-size: .8rem; color: var(--text-muted); display: flex; align-items: center; gap: 3px; }
    .cr-job-right { display: flex; align-items: center; gap: 12px; }
    .cr-type  { font-size: .75rem; font-weight: 600; background: var(--info-bg); color: var(--info); padding: 3px 10px; border-radius: var(--radius-pill); white-space: nowrap; }
    .cr-note  { font-size: .75rem; color: var(--text-muted); margin-bottom: 32px; }
    .cr-driver-cta { background: var(--navy); color: #fff; border-radius: var(--radius-xl); padding: 36px; }
    .cr-driver-cta h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
    .cr-driver-cta p  { color: rgba(255,255,255,.7); margin-bottom: 16px; font-size: .9rem; line-height: 1.6; }
  `]
})
export class CareersComponent {
  jobs = [
    { dept: 'Engineering',   title: 'Senior Angular Developer',      location: 'Ottawa, ON / Remote', type: 'Full-time' },
    { dept: 'Engineering',   title: 'Spring Boot Backend Engineer',   location: 'Ottawa, ON',          type: 'Full-time' },
    { dept: 'Operations',    title: 'City Operations Manager',        location: 'Ottawa, ON',          type: 'Full-time' },
    { dept: 'Customer Care', title: 'Support Agent (English/French)', location: 'Ottawa, ON',          type: 'Part-time' },
    { dept: 'Growth',        title: 'Business Development Manager',   location: 'Ottawa, ON',          type: 'Full-time' },
  ];
}
