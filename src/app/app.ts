import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ConfigBar } from './features/editor/config-bar/config-bar';
import { Editor } from './features/editor/editor/editor';
import { ProjectHeading } from './features/editor/project-heading/project-heading';
import { ExportBar } from './features/export/export-bar/export-bar';
import { Preview } from './features/preview/preview/preview';

@Component({
  imports: [TranslocoPipe, ConfigBar, Editor, ExportBar, Preview, ProjectHeading],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
