import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { truncate } from '@playbook/shared-util';

const SUMMARY_MAX_LENGTH = 160;

/** Presents one playbook pattern as a Material card. */
@Component({
  selector: 'pb-pattern-card',
  imports: [MatCardModule],
  templateUrl: './pattern-card.html',
  styleUrl: './pattern-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternCard {
  readonly title = input.required<string>();
  readonly summary = input.required<string>();
  readonly status = input.required<string>();

  protected readonly shortSummary = computed(() => truncate(this.summary(), SUMMARY_MAX_LENGTH));
}
