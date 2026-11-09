import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ConfigBar } from './features/editor/config-bar';
import { Editor } from './features/editor/editor';
import { Preview } from './features/preview/preview';

@Component({
  imports: [TranslocoPipe, ConfigBar, Editor, Preview],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
