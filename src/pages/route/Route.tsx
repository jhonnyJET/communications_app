import { useEffect, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  Alert,
  Autocomplete as MuiAutocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { getTrackerHost, MQTT_WS_URL } from '../../utils/server';
import { useSimulationMqtt } from '../../hooks/useSimulationMqtt';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? '';
const SIMULATION_REQUEST_URL = `${getTrackerHost()}/simulations/request`;

const PROTOCOLS = ['WEBSOCKET', 'SSE', 'MQTT', 'GRPC', 'REST'] as const;
type Protocol = typeof PROTOCOLS[number];

const STEPS = ['Addresses', 'Configuration', 'Protocols'];

// ── Helpers ───────────────────────────────────────────────────────────────────

interface PlacesAutocompleteProps {
  label: string;
  onSelect: (place: google.maps.places.Place | null) => void;
}

function PlacesAutocomplete({ label, onSelect }: PlacesAutocompleteProps) {
  const placesLib = useMapsLibrary('places');
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);

  useEffect(() => {
    if (!placesLib || !inputValue.trim()) {
      setOptions([]);
      return;
    }
    if (!sessionToken.current) {
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
    let active = true;
    const timer = setTimeout(() => {
      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: inputValue,
        sessionToken: sessionToken.current!,
      })
        .then(({ suggestions }) => { if (active) setOptions(suggestions); })
        .catch(() => { if (active) setOptions([]); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [inputValue, placesLib]);

  const handleSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion | null,
  ) => {
    if (!suggestion?.placePrediction) { onSelect(null); return; }
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
    sessionToken.current = null;
    onSelect(place);
  };

  return (
    <MuiAutocomplete
      options={options}
      getOptionLabel={(s) => s.placePrediction?.text.text ?? ''}
      isOptionEqualToValue={(a, b) =>
        a.placePrediction?.placeId === b.placePrediction?.placeId
      }
      filterOptions={(x) => x}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      onChange={(_, value) =>
        handleSelect(value as google.maps.places.AutocompleteSuggestion | null)
      }
      noOptionsText={inputValue ? 'No places found' : 'Start typing an address'}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" fullWidth />
      )}
    />
  );
}

interface CounterFieldProps {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}

function CounterField({ label, value, max, onChange }: CounterFieldProps) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (!isNaN(n)) onChange(Math.min(max, Math.max(0, n)));
      }}
      inputProps={{ min: 0, max }}
      variant="outlined"
      fullWidth
    />
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

interface FormState {
  startPlace: google.maps.places.Place | null;
  destPlace: google.maps.places.Place | null;
  serverUpdateRatio: number;
  clientUpdateRatio: number;
  exchangeRatePerMin: number;
  numberOfUsers: number;
  protocols: Record<Protocol, boolean>;
  isStreaming: boolean;
  numberOfClientDataPoints: number;
  numberOfServerDataPoints: number;
}

function StepAddresses({
  setForm,
}: {
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PlacesAutocomplete
        label="Start address"
        onSelect={(p) => setForm((f) => ({ ...f, startPlace: p }))}
      />
      <PlacesAutocomplete
        label="Destination"
        onSelect={(p) => setForm((f) => ({ ...f, destPlace: p }))}
      />
    </Box>
  );
}

function StepConfiguration({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const handleStreamingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isStreaming = e.target.checked;
    setForm((f) => ({
      ...f,
      isStreaming,
      ...(isStreaming
        ? { serverUpdateRatio: 0, clientUpdateRatio: 0, exchangeRatePerMin: 0 }
        : { numberOfClientDataPoints: 0, numberOfServerDataPoints: 0 }),
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormControlLabel
        control={<Checkbox checked={form.isStreaming} onChange={handleStreamingChange} />}
        label="Streaming"
      />

      {!form.isStreaming && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CounterField
              label="ServerUpdateRatio"
              value={form.serverUpdateRatio}
              max={100}
              onChange={(v) => setForm((f) => ({ ...f, serverUpdateRatio: v }))}
            />
            <Typography sx={{ flexShrink: 0 }}>:</Typography>
            <CounterField
              label="ClientUpdateRatio"
              value={form.clientUpdateRatio}
              max={100}
              onChange={(v) => setForm((f) => ({ ...f, clientUpdateRatio: v }))}
            />
          </Box>
          <CounterField
            label="ExchangeRatePerMin"
            value={form.exchangeRatePerMin}
            max={600}
            onChange={(v) => setForm((f) => ({ ...f, exchangeRatePerMin: v }))}
          />
          <CounterField
            label="NumberOfClientDataPoints"
            value={form.numberOfClientDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfClientDataPoints: v }))}
          />
          <CounterField
            label="NumberOfServerDataPoints"
            value={form.numberOfServerDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfServerDataPoints: v }))}
          />
        </>
      )}

      {form.isStreaming && (
        <>
          <CounterField
            label="NumberOfClientDataPoints"
            value={form.numberOfClientDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfClientDataPoints: v }))}
          />
          <CounterField
            label="NumberOfServerDataPoints"
            value={form.numberOfServerDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfServerDataPoints: v }))}
          />
        </>
      )}

      <CounterField
        label="Number of Users"
        value={form.numberOfUsers}
        max={200}
        onChange={(v) => setForm((f) => ({ ...f, numberOfUsers: v }))}
      />
    </Box>
  );
}

function StepProtocols({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const toggle = (p: Protocol) =>
    setForm((f) => ({ ...f, protocols: { ...f.protocols, [p]: !f.protocols[p] } }));

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Select the protocols:</FormLabel>
      <FormGroup row>
        {PROTOCOLS.map((p) => (
          <FormControlLabel
            key={p}
            label={p}
            control={<Checkbox checked={form.protocols[p]} onChange={() => toggle(p)} />}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}

// ── Queue status ───────────────────────────────────────────────────────────────

interface QueueResponse {
  simulationId: string;
  position: number;
  estimatedWaitTime: string;
}

function QueueStatus({
  queue,
  simulationReady,
}: {
  queue: QueueResponse;
  simulationReady: boolean;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {simulationReady ? (
          <Alert severity="success">
            Your simulation is starting! Simulation ID: <strong>{queue.simulationId}</strong>
          </Alert>
        ) : (
          <>
            <Alert severity="info">
              You are in the queue. Position: <strong>{queue.position}</strong> — Estimated wait:{' '}
              <strong>{queue.estimatedWaitTime}</strong>
            </Alert>
            <Typography variant="caption" color="text.secondary">
              Simulation ID: {queue.simulationId} — Waiting for MQTT notification…
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  startPlace: null,
  destPlace: null,
  serverUpdateRatio: 0,
  clientUpdateRatio: 0,
  exchangeRatePerMin: 0,
  numberOfUsers: 0,
  protocols: { WEBSOCKET: false, SSE: false, MQTT: false, GRPC: false, REST: false },
  isStreaming: false,
  numberOfClientDataPoints: 0,
  numberOfServerDataPoints: 0,
};

function RouteContent() {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [queueResponse, setQueueResponse] = useState<QueueResponse | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const mqttNotification = useSimulationMqtt(clientId, MQTT_WS_URL);
  const simulationReady = mqttNotification?.message?.toLowerCase().includes('turn') ?? false;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setQueueResponse(null);

    const newClientId = crypto.randomUUID();
    setClientId(newClientId);

    try {
      const userIds = Array.from({ length: form.numberOfUsers }, (_, i) => `user${i + 1}`);
      const selectedProtocols = PROTOCOLS.filter((p) => form.protocols[p]);

      const { data } = await axios.post<QueueResponse>(SIMULATION_REQUEST_URL, {
        clientId: newClientId,
        protocols: selectedProtocols,
        startAddress: form.startPlace?.formattedAddress ?? '',
        destination: form.destPlace?.formattedAddress ?? '',
        userIds,
        serverUpdateRatio: form.serverUpdateRatio,
        clientUpdateRatio: form.clientUpdateRatio,
        exchangeRatePerMin: form.exchangeRatePerMin,
        isStreaming: form.isStreaming,
        numberOfClientDataPoints: form.numberOfClientDataPoints,
        numberOfServerDataPoints: form.numberOfServerDataPoints,
      });

      setQueueResponse(data);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setActiveStep(0);
    setQueueResponse(null);
    setClientId(null);
    setSubmitError(null);
  };

  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 640 }}>
      <Typography variant="h6">Route</Typography>

      {queueResponse ? (
        <>
          <QueueStatus queue={queueResponse} simulationReady={simulationReady} />
          <Button onClick={handleReset}>New Simulation</Button>
        </>
      ) : (
        <>
          <Stepper activeStep={activeStep}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box>
            {activeStep === 0 && <StepAddresses setForm={setForm} />}
            {activeStep === 1 && <StepConfiguration form={form} setForm={setForm} />}
            {activeStep === 2 && <StepProtocols form={form} setForm={setForm} />}
          </Box>

          {submitError && (
            <Alert severity="error">{submitError}</Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep((s) => s - 1)}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Request Simulation'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export function Route() {
  return (
    <APIProvider apiKey={API_KEY}>
      <RouteContent />
    </APIProvider>
  );
}
