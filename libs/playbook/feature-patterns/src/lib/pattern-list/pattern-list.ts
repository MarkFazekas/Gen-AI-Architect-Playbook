import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PatternApi } from '@playbook/data-access';
import { PatternCard } from '@playbook/shared-ui';

/** Lists the playbook patterns. */
@Component({
  selector: 'pb-pattern-list',
  imports: [PatternCard],
  templateUrl: './pattern-list.html',
  styleUrl: './pattern-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternList {
  protected readonly patterns = toSignal(inject(PatternApi).list(), { initialValue: [] });
}
