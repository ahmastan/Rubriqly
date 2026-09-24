import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { LevelBar } from '../components/LevelBar'
import { getRubric, saveRubric } from '../lib/api'
import {
  blankRubricValues,
  builderSchema,
  emptyItem,
  rubricToValues,
  slugify,
  valuesToRubric,
  type BuilderValues,
} from '../lib/builderForm'
import { itemToJevQuestion, type BuilderItem } from '../lib/jevPayload'
import { newId } from '../lib/localStore'
import { hashUnit, mockCriterionScore } from '../lib/mockJev'
import { rubricToYaml } from '../lib/rubricYaml'
import { SAMPLE_ESSAY } from '../lib/sampleEssay'
import { clampLevel } from '../lib/scoring'
import { buttonStyles, cn, fieldStyles, pageBar, sectionLabel } from '../lib/ui'

export function BuilderPage() {
  const { rubricId } = useParams()
  const rubric = useQuery({
    queryKey: ['rubric', rubricId],
    queryFn: () => getRubric(rubricId!),
    enabled: Boolean(rubricId),
  })

  if (rubricId && rubric.isPending) {
    return <p className="p-10 text-sm text-ink-2">Loading rubric…</p>
  }
  if (rubricId && rubric.isError) {
    return (
      <div className="flex flex-col items-start gap-4 p-10">
        <h1 className="m-0 text-xl font-semibold">Rubric not found</h1>
        <Link to="/rubrics/new" className={buttonStyles.primary}>
          Start a new rubric
        </Link>
      </div>
    )
  }

  const initial = rubric.data ? rubricToValues(rubric.data) : blankRubricValues()
  return <BuilderForm key={rubricId ?? 'new'} initial={initial} />
}

function BuilderForm({ initial }: { initial: BuilderValues }) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(0)

  const form = useForm<BuilderValues>({
    resolver: zodResolver(builderSchema),
    defaultValues: initial,
  })
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = form
  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' })
  const [levels, version] = useWatch({ control, name: ['levels', 'version'] })
  const items = useWatch({ control, name: 'items' })

  const save = useMutation({
    mutationFn: (values: BuilderValues) =>
      saveRubric(valuesToRubric(values, values.id || newId(slugify(values.title)))),
    onSuccess: (saved) => {
      reset(rubricToValues(saved))
      void queryClient.invalidateQueries({ queryKey: ['rubrics'] })
      queryClient.setQueryData(['rubric', saved.id], saved)
      navigate(`/rubrics/${saved.id}/edit`, { replace: true, state: { saved: true } })
    },
  })

  const onInvalid = (formErrors: FieldErrors<BuilderValues>) => {
    const firstBad = formErrors.items
      ? Object.keys(formErrors.items)
          .map(Number)
          .find((i) => !Number.isNaN(i))
      : undefined
    if (firstBad !== undefined) setSelected(firstBad)
  }

  const exportYaml = () => {
    const values = getValues()
    const rubric = valuesToRubric(values, values.id || slugify(values.title))
    const url = URL.createObjectURL(new Blob([rubricToYaml(rubric)], { type: 'text/yaml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${slugify(values.title)}.yaml`
    link.click()
    URL.revokeObjectURL(url)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = fields.findIndex((f) => f.id === active.id)
    const to = fields.findIndex((f) => f.id === over.id)
    const selectedKey = fields[selected]?.id
    move(from, to)
    // Keep the same criterion selected after it moves.
    const order = fields.map((f) => f.id)
    order.splice(to, 0, order.splice(from, 1)[0])
    setSelected(Math.max(0, order.indexOf(selectedKey)))
  }

  const current = Math.min(selected, fields.length - 1)
  const item = items[current]
  const itemErrors = errors.items?.[current]

  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate(v), onInvalid)}
      noValidate
      className="flex grow flex-col"
    >
      <div className={pageBar}>
        <Link to="/rubrics" className="text-sm text-ink-2 no-underline hover:text-ink">
          Rubrics
        </Link>
        <span className="text-ink-2" aria-hidden="true">
          /
        </span>
        <input
          aria-label="Rubric name"
          {...register('title')}
          className="h-9 min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-sm font-medium text-ink hover:border-border focus-visible:border-accent focus-visible:bg-surface"
        />
        {isDirty && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-ink-soft">
            Unsaved changes
          </span>
        )}
        {/* Set by the navigation after saving, so the message isn't shown twice. */}
        {location.state?.saved && !isDirty && (
          <span
            role="status"
            className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-hover"
          >
            Saved on this computer
          </span>
        )}
        <span className="grow" />
        <button
          type="button"
          disabled
          title="Importing YAML needs the Rubriqly server, which isn’t connected yet."
          className={buttonStyles.secondary}
        >
          Import
        </button>
        <button type="button" onClick={exportYaml} className={buttonStyles.secondary}>
          Export YAML
        </button>
        <button type="submit" disabled={save.isPending} className={buttonStyles.primary}>
          {save.isPending ? 'Saving…' : 'Save rubric'}
        </button>
      </div>
      {errors.title && (
        <p role="alert" className="m-0 bg-warn-bg px-7 py-2 text-sm text-warn">
          {errors.title.message}
        </p>
      )}

      <div className="flex min-h-0 grow flex-col lg:flex-row">
        <nav
          aria-label="Criteria"
          className="flex shrink-0 flex-col gap-1 border-b border-divider px-3.5 py-5 lg:w-[240px] lg:border-r lg:border-b-0"
        >
          <span className={cn(sectionLabel, 'px-2.5 pb-2')}>Criteria</span>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {fields.map((field, index) => (
                  <SortableCriterion
                    key={field.id}
                    sortId={field.id}
                    name={items[index]?.name || 'Untitled criterion'}
                    kind={items[index]?.kind ?? 'score'}
                    selected={index === current}
                    hasError={Boolean(errors.items?.[index])}
                    onSelect={() => setSelected(index)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={() => {
              append(emptyItem(levels.length))
              setSelected(fields.length)
            }}
            className="mt-2 h-10 cursor-pointer rounded-[10px] border border-dashed border-faint bg-transparent text-[13px] font-medium text-ink-soft hover:bg-surface"
          >
            + Add criterion
          </button>
          {errors.items?.root && (
            <p role="alert" className="m-0 px-2.5 pt-2 text-[13px] text-warn">
              {errors.items.root.message}
            </p>
          )}
        </nav>

        <main className="flex min-w-0 grow flex-col gap-5 px-4 py-7 sm:px-8">
          {item && (
            <>
              <div className="flex flex-col gap-3.5 sm:flex-row">
                <label className="flex grow flex-col gap-1.5 text-[13px] font-medium">
                  Criterion name
                  <input
                    key={`name-${fields[current].id}`}
                    type="text"
                    {...register(`items.${current}.name`)}
                    className={cn(fieldStyles, 'h-[42px] text-[15px] font-normal')}
                  />
                  <FieldError message={itemErrors?.name?.message} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium sm:w-[200px]">
                  Question type
                  <select
                    key={`kind-${fields[current].id}`}
                    {...register(`items.${current}.kind`)}
                    className={cn(fieldStyles, 'h-[42px] px-2.5 text-sm font-normal')}
                  >
                    <option value="score">Score (levels)</option>
                    <option value="yesno">Yes / no</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                Question for Jev
                <textarea
                  key={`question-${fields[current].id}`}
                  rows={2}
                  {...register(`items.${current}.question`)}
                  className={cn(fieldStyles, 'resize-y py-2.5 text-sm leading-normal font-normal')}
                />
                <FieldError message={itemErrors?.question?.message} />
              </label>

              {item.kind === 'score' ? (
                <LevelsTable
                  key={fields[current].id}
                  index={current}
                  levels={levels}
                  register={register}
                  errors={itemErrors}
                />
              ) : (
                <p className="m-0 rounded-[14px] border border-border bg-surface px-[18px] py-4 text-sm leading-normal text-ink-soft">
                  Yes/no questions appear in the assignment checklist. Jev returns how likely the
                  answer is yes, so there are no levels or tips to write.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <p className="m-0 grow text-[13px] leading-normal text-ink-2">
                  Tips are written by the rubric’s author. Jev only picks the level; it never writes
                  feedback.
                </p>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      remove(current)
                      setSelected(Math.max(0, current - 1))
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-[13px] text-ink-2 hover:text-warn"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove criterion
                  </button>
                )}
              </div>
            </>
          )}
        </main>

        {item && <JevPanel item={item} version={version} levels={levels} />}
      </div>
      {save.isError && (
        <p role="alert" className="m-0 bg-warn-bg px-7 py-2 text-sm text-warn">
          {save.error.message}
        </p>
      )}
    </form>
  )
}

function SortableCriterion({
  sortId,
  name,
  kind,
  selected,
  hasError,
  onSelect,
}: {
  sortId: string
  name: string
  kind: BuilderItem['kind']
  selected: boolean
  hasError: boolean
  onSelect: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-1 rounded-[10px]',
        selected ? 'bg-selected' : 'hover:bg-muted',
        isDragging && 'relative z-10 bg-surface shadow-sm',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${name}`}
        className="flex h-10 w-7 shrink-0 cursor-grab items-center justify-center rounded-md border-0 bg-transparent text-handle"
      >
        <GripVertical size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex min-h-10 grow cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent py-2 pr-2.5 text-left text-sm text-ink',
          selected ? 'font-semibold' : 'font-normal',
        )}
      >
        <span className="grow truncate">{name}</span>
        {hasError && (
          <span className="size-2 shrink-0 rounded-full bg-warn-ring" aria-label="Has errors" />
        )}
        <span className="font-mono text-[11px] text-ink-2">
          {kind === 'yesno' ? 'yes/no' : 'score'}
        </span>
      </button>
    </li>
  )
}

function LevelsTable({
  index,
  levels,
  register,
  errors,
}: {
  index: number
  levels: string[]
  register: UseFormRegister<BuilderValues>
  errors?: FieldErrors<BuilderItem>
}) {
  const cell = cn(
    fieldStyles,
    'min-h-[64px] resize-y border-transparent bg-transparent px-2 py-1.5 text-sm leading-normal hover:border-border',
  )
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
      <div className="hidden grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] gap-4 bg-bg px-[18px] py-2.5 text-xs font-semibold tracking-[0.04em] text-ink-2 uppercase md:grid">
        <span>Level</span>
        <span>What it looks like</span>
        <span>Tip shown to students</span>
      </div>
      {levels.map((level, l) => (
        <div
          key={level}
          className="grid grid-cols-1 items-start gap-2 border-t border-divider px-[18px] py-3.5 first-of-type:border-t-0 md:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)] md:gap-4"
        >
          <div className="flex flex-col gap-1.5 pt-1.5">
            <span className="text-sm font-semibold">{level}</span>
            <LevelBar level={l + 1} count={levels.length} label={level} size="sm" />
          </div>
          <div>
            <textarea
              aria-label={`${level}: what it looks like`}
              {...register(`items.${index}.descriptors.${l}`)}
              className={cn(cell, 'text-ink-body')}
            />
            <FieldError message={errors?.descriptors?.[l]?.message} />
          </div>
          <div>
            <textarea
              aria-label={`${level}: tip shown to students`}
              {...register(`items.${index}.tips.${l}`)}
              className={cn(cell, 'text-ink-soft')}
            />
            <FieldError message={errors?.tips?.[l]?.message} />
          </div>
        </div>
      ))}
    </div>
  )
}

function JevPanel({
  item,
  version,
  levels,
}: {
  item: BuilderItem
  version: number
  levels: string[]
}) {
  const [test, setTest] = useState<{ text: string; forItem: string }>()
  const key = item.id || slugify(item.name)
  const payload = JSON.stringify({ [key]: itemToJevQuestion(item) }, null, 2)

  const runTest = () => {
    if (item.kind === 'yesno') {
      const p = hashUnit(key + SAMPLE_ESSAY)
      setTest({
        forItem: key,
        text: `Sample essay: ${p >= 0.5 ? 'yes' : 'no'} · p ${p.toFixed(2)}`,
      })
      return
    }
    const { raw, confidence } = mockCriterionScore({ id: key }, SAMPLE_ESSAY, levels.length)
    const level = clampLevel(raw, levels.length)
    setTest({
      forItem: key,
      text: `Sample essay: ${levels[level - 1]} (${level} of ${levels.length}) · conf ${confidence.toFixed(2)}`,
    })
  }

  return (
    <aside
      aria-label="What Jev receives"
      className="flex shrink-0 flex-col gap-3.5 bg-dark p-6 text-dark-ink lg:w-[420px]"
    >
      <div className="flex items-center gap-2.5">
        <span className={cn(sectionLabel, 'grow text-faint')}>What Jev receives</span>
        <span className="rounded-full bg-dark-2 px-2 py-0.5 font-mono text-[11px] text-faint">
          rubric v{version}
        </span>
      </div>
      <pre className="m-0 overflow-auto rounded-xl bg-dark-code p-4 font-mono text-[12.5px] leading-[1.65] whitespace-pre-wrap text-dark-code-ink">
        {payload}
      </pre>
      <p className="m-0 text-[13px] leading-[1.55] text-faint">
        Tips stay in the app. Only the question and level descriptions are sent, so the rubric
        wording is what decides accuracy.
      </p>
      <div className="mt-auto flex flex-col gap-2.5">
        {test && test.forItem === key && (
          <p
            role="status"
            className="m-0 rounded-[10px] bg-dark-2 px-3 py-2.5 text-[13px] text-dark-ink"
          >
            {test.text}
            {/* Simulated in the browser, so trying a rubric while editing costs nothing. */}
            <span className="text-faint"> · demo result</span>
          </p>
        )}
        <button type="button" onClick={runTest} className={buttonStyles.darkOutline}>
          Test on a sample essay
        </button>
      </div>
    </aside>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="m-0 mt-1 text-[13px] font-normal text-warn">
      {message}
    </p>
  )
}
