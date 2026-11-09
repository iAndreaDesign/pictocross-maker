import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Editor } from './features/editor/editor';
import { Preview } from './features/preview/preview';

@Component({
  imports: [TranslocoPipe, Editor, Preview],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
